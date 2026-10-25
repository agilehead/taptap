using Microsoft.Extensions.Logging.Abstractions;
using TapTap.AdapterNotifications;
using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;

internal static class SmtpProbe
{
    public static async Task<int> Run(string[] arguments)
    {
        if (arguments.Length is not (3 or 4)) throw new ArgumentException("SMTP probe requires host, port, secure flag and optional rejection mode");
        var rejection = arguments.Length == 4 ? arguments[3] : null;
        if (rejection is not (null or "reject-auth" or "reject-certificate")) throw new ArgumentException("Invalid SMTP rejection mode");
        var provider = Email.Smtp(new SmtpOptions(arguments[0], int.Parse(arguments[1], System.Globalization.CultureInfo.InvariantCulture),
            bool.Parse(arguments[2]), "test-user", rejection == "reject-auth" ? "wrong-password" : "test-password"), NullLogger.Instance);
        var result = await provider.Send(new EmailMessage(new EmailAddress("from@example.test", "From 東京"),
            [new EmailAddress("to@example.test", "To 東京"), new EmailAddress("second@example.test", "Second")],
            "Subject 東京", "<p>HTML 東京</p>", "Text 東京", new EmailAddress("reply@example.test", "Reply")), CancellationToken.None);
        if (result.IsSuccess != (rejection is null)) throw new InvalidOperationException("SMTP probe returned the wrong delivery outcome");
        if (rejection is not null && string.IsNullOrEmpty(result.Error?.Message)) throw new InvalidOperationException("Missing SMTP rejection detail");
        Console.WriteLine("SMTP provider probe passed");
        return 0;
    }
}
