import { createServer } from "node:net";
import {
  createServer as createTlsServer,
  createSecureContext,
  TLSSocket,
} from "node:tls";

export async function smtpFixture({
  mode,
  key,
  cert,
  failures = 1,
  host = "127.0.0.1",
}) {
  const sockets = new Set();
  const messages = [];
  const envelopes = [];
  const authentications = [];
  let remainingFailures = failures;
  let quitFailures = 0;
  let deferred;
  function connection(socket, upgraded = false) {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => {
      /* The owning test asserts delivery and TLS failures. */
    });
    let buffer = "",
      data = null,
      login = null,
      user = null,
      authenticated = false;
    const reply = (value) => socket.write(value + "\r\n");
    if (!upgraded) reply("220 smtp-fixture ESMTP");
    function receive(chunk) {
      buffer += chunk.toString("utf8");
      let index;
      while ((index = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (data !== null) {
          if (line === ".") {
            messages.push(data.join("\r\n"));
            data = null;
            if (remainingFailures > 0) {
              remainingFailures--;
              reply("550 fixture rejection");
            } else if (deferred) {
              const pending = deferred;
              deferred = null;
              pending.received();
              pending.release.then(() => reply("250 fixture accepted"));
            } else reply("250 fixture accepted");
          } else data.push(line.startsWith("..") ? line.slice(1) : line);
          continue;
        }
        if (login === "user") {
          user = Buffer.from(line, "base64").toString();
          login = "password";
          reply("334 UGFzc3dvcmQ6");
          continue;
        }
        if (login === "password") {
          const password = Buffer.from(line, "base64").toString();
          login = null;
          authenticated = user === "test-user" && password === "test-password";
          authentications.push({ user, valid: authenticated });
          reply(authenticated ? "235 authenticated" : "535 rejected");
          continue;
        }
        const verb = line.split(" ", 1)[0].toUpperCase();
        if (verb === "EHLO" || verb === "HELO") {
          reply("250-smtp-fixture");
          reply("250-AUTH PLAIN LOGIN");
          if (mode === "starttls" && !socket.encrypted) reply("250-STARTTLS");
          reply("250 PIPELINING");
        } else if (
          verb === "STARTTLS" &&
          mode === "starttls" &&
          !socket.encrypted
        ) {
          reply("220 Begin TLS");
          socket.removeListener("data", receive);
          const encrypted = new TLSSocket(socket, {
            isServer: true,
            secureContext: createSecureContext({ key, cert }),
          });
          connection(encrypted, true);
          return;
        } else if (verb === "AUTH") {
          if (mode === "starttls" && !socket.encrypted) {
            reply("538 encryption required");
            continue;
          }
          const [, mechanism, credentials] = line.split(" ");
          if (mechanism?.toUpperCase() === "PLAIN") {
            const parts = Buffer.from(credentials ?? "", "base64")
              .toString()
              .split("\0");
            authenticated =
              parts.at(-2) === "test-user" && parts.at(-1) === "test-password";
            authentications.push({ user: parts.at(-2), valid: authenticated });
            reply(authenticated ? "235 authenticated" : "535 rejected");
          } else if (mechanism?.toUpperCase() === "LOGIN") {
            login = "user";
            reply("334 VXNlcm5hbWU6");
          } else reply("504 unsupported authentication");
        } else if (verb === "MAIL" || verb === "RCPT") {
          envelopes.push(line);
          reply(authenticated ? "250 accepted" : "530 authentication required");
        } else if (verb === "DATA") {
          data = [];
          reply("354 End with a dot");
        } else if (verb === "RSET" || verb === "NOOP") reply("250 ok");
        else if (verb === "QUIT") {
          reply(quitFailures-- > 0 ? "500 fixture close failure" : "221 bye");
          socket.end();
        } else reply("500 unexpected command");
      }
    }
    socket.on("data", receive);
  }
  const server =
    mode === "tls"
      ? createTlsServer({ key, cert }, connection)
      : createServer(connection);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, resolve);
  });
  return {
    port: server.address().port,
    messages,
    envelopes,
    authentications,
    rejectNextQuit: () => {
      quitFailures++;
    },
    deferNext: () => {
      let received, release;
      const arrived = new Promise((resolve) => {
        received = resolve;
      });
      const released = new Promise((resolve) => {
        release = resolve;
      });
      deferred = { received, release: released };
      return { arrived, release };
    },
    close: () =>
      new Promise((resolve) => {
        for (const socket of sockets) socket.destroy();
        server.close(resolve);
      }),
  };
}
