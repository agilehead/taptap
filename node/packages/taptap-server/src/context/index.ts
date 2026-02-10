import type { NotificationProvider } from "../providers/types.js";
import type { EmailProvider } from "../providers/email/types.js";
import type { EmailQueueRepository } from "../queue/types.js";

export type Context = {
  provider: NotificationProvider;
  emailProvider: EmailProvider;
  queueRepo: EmailQueueRepository;
};

export function createContext(
  provider: NotificationProvider,
  emailProvider: EmailProvider,
  queueRepo: EmailQueueRepository,
): Context {
  return { provider, emailProvider, queueRepo };
}
