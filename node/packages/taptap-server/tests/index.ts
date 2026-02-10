import { setupGlobalHooks } from "./setup.js";

// Setup global before/after hooks
setupGlobalHooks();

// Template tests
import "./tests/templates/template.test.js";
import "./tests/templates/render.test.js";

// Queue tests
import "./tests/queue/repository.test.js";
import "./tests/queue/processor.test.js";

// Throttle tests
import "./tests/throttle/repository.test.js";

// GraphQL resolver tests
import "./tests/resolvers/health.test.js";
import "./tests/resolvers/send-email.test.js";
import "./tests/resolvers/send-raw-email.test.js";
