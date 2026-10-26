import type { EmailProvider } from "../providers/email/types.js";
import type { EmailQueueRepository } from "../queue/types.js";
import type { ThrottleRepository } from "../throttle/types.js";
import type { EmailTemplateRepository } from "../templates/types.js";

export type Context = {
  queueRepo: EmailQueueRepository;
  emailProvider: EmailProvider;
  throttleRepo: ThrottleRepository;
  templateRepo: EmailTemplateRepository;
};

export function createContext(
  queueRepo: EmailQueueRepository,
  emailProvider: EmailProvider,
  throttleRepo: ThrottleRepository,
  templateRepo: EmailTemplateRepository,
): Context {
  return { queueRepo, emailProvider, throttleRepo, templateRepo };
}
