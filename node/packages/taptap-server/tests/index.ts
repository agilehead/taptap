import { setupGlobalHooks } from "./setup.js";

// Setup global before/after hooks
setupGlobalHooks();

// Email template tests
import "./tests/email/email-helpers.test.js";
import "./tests/email/auction-won.test.js";
import "./tests/email/item-sold.test.js";
import "./tests/email/outbid.test.js";
import "./tests/email/new-item-chat-message.test.js";
import "./tests/email/templates-dispatcher.test.js";

// Queue tests
import "./tests/queue/repository.test.js";
import "./tests/queue/processor.test.js";
import "./tests/queue/provider.test.js";

// GraphQL resolver tests
import "./tests/resolvers/health.test.js";
import "./tests/resolvers/send-notification.test.js";
