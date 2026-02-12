# Coding Standards

This document outlines the coding standards and patterns used throughout the TapTap notification service codebase. All contributors must follow these guidelines to maintain consistency and quality.

## Core Principles

### 1. Functional Programming First

**NO CLASSES** - Use functions and modules exclusively.

```typescript
// Good - Pure function with explicit dependencies
export async function createEmailTemplate(
  db: Database,
  data: CreateEmailTemplateData,
): Promise<Result<EmailTemplate>> {
  // Implementation
}

// Bad - Service class for stateless operations
export class EmailTemplateService {
  constructor(private db: Database) {}

  async createEmailTemplate(data: CreateEmailTemplateData): Promise<EmailTemplate> {
    // This should be a function, not a class method
  }
}
```

### 2. Explicit Error Handling with Result Types

Use `Result<T>` for all operations that can fail. Never throw exceptions for expected errors.

```typescript
// Result type definition (in types.ts)
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// Good - Using Result type
export async function findEmailTemplate(db: Database, templateId: string): Promise<Result<EmailTemplate>> {
  try {
    const templates = await executeSelect(
      db,
      schema,
      (q, p) =>
        q
          .from("email_template")
          .where((t) => t.id === p.templateId)
          .select((t) => ({ ...t }))
          .take(1),
      { templateId }
    );

    if (templates.length === 0) {
      return {
        success: false,
        error: new Error("Email template not found"),
      };
    }

    return { success: true, data: templates[0] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// Bad - Throwing exceptions
export async function findEmailTemplate(db: Database, templateId: string): Promise<EmailTemplate> {
  const templates = await executeSelect(/* ... */);
  if (templates.length === 0) throw new Error("Email template not found");
  return templates[0];
}
```

### 3. Database Patterns with Tinqer

#### All SQL MUST use Tinqer

**CRITICAL**: Never write raw SQL. Always use Tinqer for type-safe queries.

```typescript
// Good - Tinqer query
import { createSchema, executeSelect, executeInsert } from "@tinqerjs/tinqer";
import { executeSqlite } from "@tinqerjs/tinqer-sqlite";

const schema = createSchema<DatabaseSchema>();

export async function createEmailQueue(db: Database, data: CreateEmailQueueData): Promise<Result<EmailQueue>> {
  const result = await executeInsert(
    db,
    schema,
    (q, p) =>
      q
        .insertInto("email_queue")
        .values({
          id: p.id,
          template_id: p.templateId,
          recipient_email: p.recipientEmail,
          subject: p.subject,
          body: p.body,
          status: p.status,
          scheduled_at: p.scheduledAt,
        })
        .returning((e) => ({ ...e })),
    {
      id: generateUUID(),
      templateId: data.templateId,
      recipientEmail: data.recipientEmail,
      subject: data.subject,
      body: data.body,
      status: "pending",
      scheduledAt: data.scheduledAt,
    }
  );

  return { success: true, data: result };
}

// Bad - Raw SQL
export async function createEmailQueue(db: Database, data: CreateEmailQueueData): Promise<EmailQueue> {
  return db.run(`INSERT INTO email_queue (id, template_id, recipient_email) VALUES (?, ?, ?)`, [
    data.id,
    data.templateId,
    data.recipientEmail,
  ]);
}
```

#### DbRow Types

All database types must exactly mirror the database schema with snake_case:

```typescript
// Database schema types (snake_case)
type EmailTemplateDbRow = {
  id: string;
  name: string;
  subject: string;
  body_template: string;
  description: string | null;
  variables: string | null;
  created_at: string;
  updated_at: string;
};

type EmailQueueDbRow = {
  id: string;
  template_id: string | null;
  recipient_email: string;
  subject: string;
  body: string;
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
};
```

#### Repository Pattern

Implement repositories as functional interfaces:

```typescript
// Repository interface
export type IEmailTemplateRepository = {
  findById: (id: string) => Promise<Result<EmailTemplate>>;
  findByName: (name: string) => Promise<Result<EmailTemplate>>;
  create: (data: CreateEmailTemplateData) => Promise<Result<EmailTemplate>>;
  update: (id: string, data: UpdateEmailTemplateData) => Promise<Result<EmailTemplate>>;
};

// Repository implementation
export function createEmailTemplateRepository(db: Database): IEmailTemplateRepository {
  const schema = createSchema<DatabaseSchema>();

  return {
    findById: async (id) => {
      const templates = await executeSelect(
        db,
        schema,
        (q, p) =>
          q
            .from("email_template")
            .where((t) => t.id === p.id)
            .select((t) => ({ ...t }))
            .take(1),
        { id }
      );

      return templates.length > 0
        ? { success: true, data: mapEmailTemplateFromDb(templates[0]) }
        : { success: false, error: new Error("Email template not found") };
    },
    // ... other methods
  };
}
```

### 4. Module Structure

#### Imports

All imports MUST include the `.js` extension:

```typescript
// Good
import { createEmailTemplateRepository } from "./repositories/email-template.js";
import { sendEmail } from "./services/email-sender.js";
import type { Result } from "./types.js";

// Bad
import { createEmailTemplateRepository } from "./repositories/email-template";
import { sendEmail } from "./services/email-sender";
```

#### Exports

Use named exports exclusively:

```typescript
// Good
export function createEmailQueue() { ... }
export function processEmailQueue() { ... }
export type EmailQueue = { ... };

// Bad
export default class EmailQueueService { ... }
```

### 5. Naming Conventions

#### General Rules

- **Functions**: camelCase (`createEmailTemplate`, `sendEmail`, `processQueue`)
- **Types**: PascalCase (`EmailTemplate`, `EmailQueue`, `Throttle`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `DEFAULT_PORT`)
- **Files**: kebab-case (`create-email-template.ts`, `email-sender.ts`)
- **Database**: snake_case tables and columns (`email_template`, `created_at`, `template_id`)

#### Database Naming

- **Tables**: singular, lowercase (`email_template`, `email_queue`)
- **Columns**: snake_case (`template_id`, `created_at`, `recipient_email`)
- **Foreign Keys**: `{table}_id` (`template_id`, `email_queue_id`)

### 6. TypeScript Guidelines

#### Strict Mode

Always use TypeScript strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### Type vs Interface

Prefer `type` over `interface`:

```typescript
// Good - Using type
type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  bodyTemplate: string;
  description: string | null;
  variables: string[];
};

type EmailQueue = {
  id: string;
  templateId: string | null;
  recipientEmail: string;
  subject: string;
  body: string;
  status: string;
};

// Use interface only for extensible contracts or declaration merging
```

#### Strict Equality Only

**CRITICAL**: Always use strict equality operators (`===` and `!==`). Never use loose equality (`==` or `!=`).

```typescript
// Good - Strict equality
if (value === null) { ... }
if (value !== undefined) { ... }
if (emailQueue !== null && emailQueue !== undefined) { ... }

// Bad - Loose equality (BANNED)
if (value == null) { ... }
if (value != undefined) { ... }
```

#### Avoid `any`

Never use `any`. Use `unknown` if type is truly unknown:

```typescript
// Good
function parseJSON(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Bad
function parseJSON(content: any): any {
  return JSON.parse(content);
}
```

### 7. Async/Await Pattern

Always use async/await instead of promises:

```typescript
// Good
export async function processEmailQueue(
  emailSender: EmailSender,
  queueId: string
): Promise<Result<EmailQueue>> {
  const queueResult = await emailSender.getEmailFromQueue(queueId);
  if (!queueResult.success) {
    return queueResult;
  }

  const sendResult = await emailSender.sendEmail(queueResult.data);
  return sendResult;
}

// Bad - Promise chains
export function processEmailQueue(
  emailSender: EmailSender,
  queueId: string
): Promise<Result<EmailQueue>> {
  return emailSender.getEmailFromQueue(queueId).then((queueResult) => {
    if (!queueResult.success) {
      return queueResult;
    }
    return emailSender.sendEmail(queueResult.data);
  });
}
```

### 8. GraphQL Resolver Patterns

```typescript
// Good - Proper error handling with Result types
export const emailTemplateResolvers = {
  Query: {
    emailTemplate: async (_parent: unknown, args: { id: string }, context: Context) => {
      const result = await context.repos.emailTemplates.findById(args.id);

      if (!result.success) {
        throw new GraphQLError(result.error.message);
      }

      return result.data;
    },
  },
  Mutation: {
    createEmailTemplate: async (
      _parent: unknown,
      args: { input: CreateEmailTemplateInput },
      context: Context
    ) => {
      const result = await context.repos.emailTemplates.create(args.input);

      if (!result.success) {
        throw new GraphQLError(result.error.message);
      }

      return result.data;
    },
  },
};
```

### 9. Documentation

Add JSDoc comments for exported functions:

```typescript
/**
 * Creates a new email template.
 *
 * @param repos - Repository instances
 * @param data - Email template data
 * @returns Result containing the created email template or an error
 */
export async function createEmailTemplate(
  repos: Repositories,
  data: CreateEmailTemplateData
): Promise<Result<EmailTemplate>> {
  // Implementation
}
```

### 10. Testing

```typescript
describe("Email Queue Service", () => {
  let db: Database;
  let emailQueueRepo: IEmailQueueRepository;
  let template: EmailTemplate;

  beforeEach(async () => {
    db = await createTestDatabase();
    const repos = createRepositories(db);
    emailQueueRepo = repos.emailQueue;

    const templateResult = await repos.emailTemplates.create({
      name: "welcome-email",
      subject: "Welcome to TapTap",
      bodyTemplate: "Hello {{name}}!",
    });
    if (!templateResult.success) throw templateResult.error;
    template = templateResult.data;
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
  });

  it("should create email queue entry", async () => {
    // Arrange
    const queueData = {
      templateId: template.id,
      recipientEmail: "test@example.com",
      subject: "Welcome",
      body: "Hello Test!",
      scheduledAt: new Date().toISOString(),
    };

    // Act
    const result = await emailQueueRepo.create(queueData);

    // Assert
    expect(result.success).to.be.true;
    if (result.success) {
      expect(result.data.recipientEmail).to.equal("test@example.com");
      expect(result.data.status).to.equal("pending");
    }
  });
});
```

### 11. Security Patterns

#### Input Validation

Always validate input:

```typescript
// Good - Validate before processing
router.post("/cron/process-email-queue", async (req, res) => {
  const { batchSize } = req.body;

  if (typeof batchSize !== "number" || batchSize < 1) {
    res.status(400).json({ error: "Invalid batchSize" });
    return;
  }

  // Process validated input
});
```

#### Authentication & Authorization

```typescript
// Internal API authentication middleware
export function createInternalAuthMiddleware(internalSecret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (authHeader !== `Bearer ${internalSecret}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    next();
  };
}
```

### 12. Logging

Use structured logging, never console.log:

```typescript
import { createLogger } from "@agilehead/taptap-logger";

const logger = createLogger("email-sender");

// Good - Structured logging
logger.info("Email sent", { recipientEmail, templateId });
logger.error("Email sending failed", { error: error.message, queueId });

// Bad - console.log
console.log("Email sent to " + recipientEmail);
```

## Code Review Checklist

Before submitting a PR, ensure:

- [ ] All functions use Result types for error handling
- [ ] No classes used
- [ ] All imports include `.js` extension
- [ ] All database queries use Tinqer (no raw SQL)
- [ ] Repository pattern implemented for data access
- [ ] JSDoc comments for public functions
- [ ] Input validation for all endpoints
- [ ] No `any` types used
- [ ] Strict equality only (`===`/`!==`, never `==`/`!=`)
- [ ] Tests included for new functionality
- [ ] No console.log statements (use logger)
- [ ] Environment variables validated at startup
