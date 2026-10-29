# CLAUDE.md

**NEVER DEPLOY WITHOUT EXPLICIT USER INSTRUCTION**: Deployments to production are STRICTLY FORBIDDEN unless the user explicitly says to deploy. This is a live system with active users. No exceptions — never run deploy scripts, push to production, or trigger any deployment pipeline without a direct, explicit instruction from the user.

**sed USAGE**

NEVER USE sed TO BULK REPLACE
NEVER USE sed TO BULK REPLACE
NEVER USE sed TO BULK REPLACE
NEVER USE sed TO BULK REPLACE

**NO QUICK FIXES**: Quick fixes and workarounds are banned in this project. Always fix the root cause properly. If a deploy script uploads to the wrong location, fix the deploy script - don't manually sync files.

**NEVER SSH INTO PRODUCTION**: Do not SSH into production servers unless the user explicitly asks you to. Production access requires explicit user authorization for each session.

**NEVER USE FORCE PUSH OR DESTRUCTIVE GIT OPERATIONS**: `git push --force`, `git push --force-with-lease`, `git reset --hard`, `git clean -fd`, or any other destructive git operations are ABSOLUTELY FORBIDDEN. Use `git revert` to undo changes instead.

This file provides guidance to Claude Code when working with the TapTap notification service.

## Service-owned layout

The repository follows Ctlflow's product ownership model. The repository root owns workspace configuration, build orchestration and documentation. Product source, database assets, operations and acceptance tests belong to `services/taptap/`.

```text
services/taptap/
  package.json
  node/
    packages/                 TypeScript client and test tooling
  csharp/
    apps/                     Thin native/managed application roots
    packages/                 Kernel, domain, contracts and adapters
    tests/                    C# probes and regression assertions
    build/                    Build-only EF compiler and design-time host
    scripts/                  C# generation/publication tools
    Dockerfile
  database/taptap/sqlite/   Database contract and existing Knex migrations
  contracts/graphql/        Shared GraphQL schema
  knexfile.taptap.mjs
  docker/                     Development and production configuration
  scripts/                    Shared product generators, operations and acceptance
  tests/contracts/            One cross-runtime assertion bank
```

Only implemented capabilities receive directories. Public package names, wire contracts, migration filenames/history, stored bytes and media paths remain unchanged. No production data is moved or reset by the source reorganization.

`npm run verify:structure` checks workspace ownership, required service roots, solution project paths and the absence of the superseded repository-wide source pools. The build runs this check. Product-specific commands are under `services/taptap/scripts/`; root npm commands remain the workspace entry points. Knex alone owns schema changes; moving its source does not run migrations.

## Canonical server architecture

The application server is C# under `services/taptap/csharp/`, with the same apps/packages/build/scripts/tests structure and pinned build infrastructure as Snapped. Managed .NET and NativeAOT use the same source. Read `README.md` and `services/taptap/csharp/README.md` for current commands and architecture. The TypeScript client SDK and Knex migrations remain Node-owned.

C# uses functional static modules, immutable domain records, function-delegate persistence ports, `Result<T>`, cancellation and `IUnitOfWork.Run`. Classes are used where EF, ASP.NET, GraphQL or provider frameworks require them. Database queries use EF LINQ; handwritten runtime SQL is forbidden. Generated EF rows are separate from domain records. Existing database schema and representations are preserved; queue IDs remain hexadecimal strings.

Required verification: `npm run build`, `npm run lint`, `npm run build:native`, `npm test`, then `npm run test:integration`. Execute real NativeAOT binaries and both Docker variants; successful managed tests alone are insufficient. Never run broad process killers for acceptance. Keep private `.analysis/` notes ignored and preserve production data. Do not publish, deploy or push without the applicable user authorization.

## Critical Guidelines

### NEVER ACT WITHOUT EXPLICIT USER APPROVAL

**YOU MUST ALWAYS ASK FOR PERMISSION BEFORE:**

- Making architectural decisions or changes
- Implementing new features or functionality
- Modifying APIs, interfaces, or data structures
- Changing expected behavior or test expectations
- Adding new dependencies or patterns

**ONLY make changes AFTER the user explicitly approves.** When you identify issues or potential improvements, explain them clearly and wait for the user's decision. Do NOT assume what the user wants or make "helpful" changes without permission.

### NEVER COMMIT DIRECTLY TO MAIN

**CRITICAL**: ALL changes must be made on a feature branch, never directly on main.

- Always create a new branch before making changes (e.g., `feature/add-template`, `fix/queue-retry`)
- Push the feature branch and create a pull request
- Only merge to main after user approval

### NEVER COMMIT WITHOUT ALL TESTS PASSING

**CRITICAL**: ALL tests must pass in BOTH local mode AND Docker Compose mode before committing.

- Run `./services/taptap/scripts/test-integration.sh local` and verify all tests pass
- Run `./services/taptap/scripts/test-integration.sh compose` and verify all tests pass in Docker
- If Docker Compose tests fail due to schema changes, rebuild Docker images first: `./services/taptap/scripts/docker-build.sh`
- No exceptions - if tests fail, fix them before committing

### NEVER BLAME "PRE-EXISTING FAILURES"

**CRITICAL**: The excuse "these are pre-existing failures" is NEVER acceptable.

- If tests fail, they must be fixed - period
- If you introduced code that breaks tests, fix your code
- If tests were already broken before your changes, fix those tests too
- The codebase must always be in a clean, passing state
- "It was already broken" is not a valid excuse for leaving things broken

### FINISH DISCUSSIONS BEFORE WRITING CODE

**IMPORTANT**: When the user asks a question or you're in the middle of a discussion, DO NOT jump to writing code. Always:

1. **Complete the discussion first** - Understand the problem fully
2. **Analyze and explain** - Work through the issue verbally
3. **Get confirmation** - Ensure the user agrees with the approach
4. **Only then write code** - After the user explicitly asks you to implement

## Session Startup & Task Management

### First Steps When Starting a Session

When you begin working on this project, you MUST:

1. **Read this entire CLAUDE.md file** to understand the project structure and conventions
2. **Check for ongoing tasks in `.todos/` directory** - Look for any in-progress task files
3. **Read the key documentation files** in this order:
   - `/README.md` - Project overview
   - `.env.example` - Configuration options

Only after reading these documents should you proceed with any implementation or analysis tasks.

## Project Overview & Principles

TapTap is a standalone notification service. It accepts notification requests via a GraphQL API, formats emails from templates, queues them in SQLite, and delivers them via SMTP with retry and throttle support.

### Production System

**IMPORTANT**: TapTap is designed for production deployments:

- **Always use migrations** - All database schema changes MUST use the migration system
- **Never modify initial schema** - The initial migration files are immutable; create new migrations for changes
- **Backward compatibility matters** - Consider existing data when making schema changes
- **All code should follow current best practices** - Maintain high quality standards
- **No change tracking in comments** - Avoid "changed from X to Y" comments in code

### Key Features

- **GraphQL API**: Template-based (`sendEmail`) and raw (`sendRawEmail`) email mutations
- **Email Templates**: Registered via API, stored in DB, with `{{variable}}` substitution
- **Email Queue**: SQLite-backed queue with batch processing and retry
- **Throttling**: Per-channel rate limiting by category, recipient, and context
- **Email Providers**: Console (dev) and SMTP (production), extensible for future backends
- **Multi-channel ready**: Architecture supports adding SMS, push, etc. alongside email

### Documentation & Code Principles

**Documentation Guidelines:**

- Write as if the spec was designed from the beginning
- Be concise and technical - avoid promotional language
- Use active voice and include code examples
- Keep README.md as single source of truth

**Code Principles:**

- **FUNCTIONAL MODULES** - Use strict types; C# framework-bound classes are permitted as described above
- **NO DYNAMIC IMPORTS** - Always use static imports
- **PREFER FUNCTIONS** - Export functions from modules
- **USE RESULT TYPES** - For error handling
- **PREFER `type` over `interface`**
- **NO EMOJIS** - Do not use emojis in code, logs, or comments

### Environment Variables

**CRITICAL**: NEVER use fallback defaults with `||` for required environment variables.

```typescript
// BAD - silent failure with default value
const host = process.env.TAPTAP_SERVER_HOST || "127.0.0.1";

// GOOD - fail fast if required var is missing
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`ERROR: Required environment variable ${name} is not set`);
    process.exit(1);
  }
  return value;
}
const host = required("TAPTAP_SERVER_HOST");
```

All required environment variables must be validated at application startup. The application should fail immediately if required variables are missing.

### Linting and Code Quality Standards

**CRITICAL**: NEVER weaken linting, testing, or type-checking rules:

- **NO eslint-disable comments** - Fix the actual issues instead of suppressing warnings
- **NO test.skip or test.only in committed code** - All tests must run and pass
- **NO @ts-expect-error or @ts-ignore** - Fix type errors properly
- **NO relaxing TypeScript strict mode** - Maintain full type safety
- **NO lowering code coverage thresholds** - Improve coverage instead
- **NO weakening any quality gates** - Standards exist for a reason

When you encounter linting, type, or test errors, the solution is ALWAYS to fix the underlying issue properly, never to suppress or bypass the error. Quality standards are non-negotiable.

**PRE-EXISTING ERRORS**: If you encounter lint, type, or test errors that existed before your changes, you MUST fix them. Pre-existing errors are never an excuse - the codebase must always be in a clean state.

## Key Technical Decisions

### Security: Never Use npx

**CRITICAL SECURITY REQUIREMENT**: NEVER use `npx` for any commands. This poses grave security risks.

- **ALWAYS use exact dependency versions** in package.json
- **ALWAYS use local node_modules binaries**
- **NEVER use `npx`** - use local dependencies

### Security: Never SSH as Root

**CRITICAL**: NEVER SSH to production servers as root.

- **ALWAYS use the application-specific user** (e.g., `taptapuser@taptap.example.com`)
- **NEVER use `root@`** in any SSH commands, scripts, or configurations
- Production uses rootless Docker - each app has its own isolated user and Docker daemon

### Database Conventions

- **SQLite** for persistence, using EF LINQ in the C# application
- **Repository Pattern** - Functional ports with a SQLite implementation
- **Singular table names**: lowercase (e.g., `email_queue`, `email_template`, `throttle`)
- **Column names**: snake_case for all columns
- **Random hex IDs** for queue items (`randomBytes(10).toString("hex").substring(0, 16)`)
- **Hard deletes** with audit logging
- **MIGRATION POLICY**: Use migration system for all schema changes

### ESM Modules

- **All imports MUST include `.js` extension**: `import { foo } from "./bar.js"`
- **TypeScript configured for `"module": "NodeNext"`**
- **Type: `"module"` in all package.json files**
- **NO DYNAMIC IMPORTS**: Always use static imports

### GraphQL Architecture

- **Single schema file** (`services/taptap/contracts/graphql/public/schema.graphql`)
- **C# GraphQL adapter** for API execution

## Essential Commands & Workflow

### Build & Development Commands

```bash
# Build entire project (from root)
./scripts/build.sh              # Standard build with formatting
./scripts/build.sh --no-format  # Skip prettier formatting (faster)

# Clean build artifacts
./scripts/clean.sh

# Start server
./services/taptap/scripts/start.sh

# Lint entire project
./scripts/lint-all.sh           # Run ESLint on all packages
./scripts/lint-all.sh --fix     # Run ESLint with auto-fix

# Format code with Prettier (MUST run before committing)
./scripts/format-all.sh

# Docker commands
./services/taptap/scripts/docker-build.sh       # Build Docker images (taptap-migrations, taptap)

# Integration tests
./services/taptap/scripts/test-integration.sh local    # Run tests with local server
./services/taptap/scripts/test-integration.sh compose  # Run tests against Docker Compose
```

### Monitoring Long-Running Operations

When running background operations like deploys, builds, or tests:

- **Check output at most every 30 seconds** - Do not poll in a tight loop
- **Be patient with slow operations** - Docker builds and deploys take time
- **Report progress periodically** - Let the user know when operations complete

### Database Commands

```bash
# Check migration status
npm run migrate:taptap:status

# Run migrations (ONLY when explicitly asked)
npm run migrate:taptap:latest
npm run migrate:taptap:rollback
```

### Testing Commands

```bash
# Run all tests
npm test

# Run acceptance against a selected implementation
node services/taptap/scripts/test-services.mjs csharp
node services/taptap/scripts/test-services.mjs nativeaot
```

### Git Workflow

**CRITICAL GIT SAFETY RULES**:

1. **NEVER use `git push --force`**
2. **ALL git push commands require EXPLICIT user authorization**
3. **Use revert commits instead of force push**

**NEW BRANCH REQUIREMENT**: ALL changes must be made on a new feature branch, never directly on main.

When the user asks you to commit and push:

1. Run `./scripts/build.sh` to build all packages (this also formats code)
2. Run `./scripts/lint-all.sh` to ensure code passes linting
3. Follow git commit guidelines
4. Get explicit user confirmation before any `git push`

### Pull Request Workflow

**NEVER use `gh pr create` to create pull requests automatically.** Always provide the URL for manual PR creation:

```
https://github.com/agilehead/taptap/pull/new/<branch-name>
```

After pushing a feature branch, provide this URL to the user so they can create the PR manually with their preferred title and description.

## Core Architecture

### Project Structure

See the service-owned layout above for the current application, client, database, contracts and test owners.

### Temporary Directories (gitignored)

These directories are excluded from git and used for temporary data:

- `.tests/` - Test run data (e.g., `.tests/test-1234567890/data/` for test databases)
- `.analysis/` - Analysis output and scratch files
- `.temp/` - General temporary files

### Key Concepts

- **Email Templates**: Registered via `registerEmailTemplate` mutation, stored in `email_template` table. Support `{{variable}}` substitution in subject, bodyHtml, bodyText.
- **Email Queue**: `email_queue` table with status tracking (pending, sending, sent, failed). Processed by external cron calling `POST /internal/cron/process-queue`.
- **Throttle**: Shared `throttle` table with `channel` column. Prevents duplicate sends for same (channel, category, recipient, context) within a time window.
- **Providers**: `EmailProvider` interface with console (development) and SMTP (production) implementations. Selected via `TAPTAP_EMAIL_PROVIDER` env var.

### Repository Pattern

The domain owns immutable function-delegate ports; the SQLite adapter implements them using EF LINQ and returns `Result<T>`.

## Environment Variables

See `.env.example` for complete list. Key variables:

### Server

- `TAPTAP_SERVER_HOST` - Server bind address (REQUIRED)
- `TAPTAP_SERVER_PORT` - Server port (default: 5006)

### Database

- `TAPTAP_DATA_DIR` - Directory for SQLite database (REQUIRED)

### Security

- `TAPTAP_CRON_SECRET` - Bearer token for internal cron endpoints (REQUIRED)
- `TAPTAP_CORS_ORIGINS` - Comma-separated allowed origins (REQUIRED)

### Email

- `TAPTAP_EMAIL_PROVIDER` - `console` or `smtp` (default: console)
- `TAPTAP_EMAIL_FROM_ADDRESS` - From address for outgoing emails (REQUIRED)
- `TAPTAP_EMAIL_FROM_NAME` - From name for outgoing emails (REQUIRED)
- `TAPTAP_SMTP_HOST`, `TAPTAP_SMTP_PORT`, `TAPTAP_SMTP_SECURE`, `TAPTAP_SMTP_USER`, `TAPTAP_SMTP_PASSWORD` - SMTP settings (required when provider is smtp)

### Queue

- `TAPTAP_QUEUE_BATCH_SIZE` - Batch size per cycle (default: 10)
- `TAPTAP_QUEUE_MAX_ATTEMPTS` - Max retry attempts (default: 3)

### Logging

- `LOG_LEVEL` - Log level (default: info)
- `TAPTAP_LOG_FILE_DIR` - Directory for log files (optional)

## Testing Strategy

### Unit Tests

- The C# contract probe checks template rendering, queue and throttle storage, retry and batch processing, and provider failures.

### Integration Tests

- Shared HTTP contracts cover template CRUD, sending, throttling, queue processing and health against each C# runtime.
- SMTP acceptance covers authenticated delivery, failure and retry over plaintext, STARTTLS and TLS.

### Test Infrastructure

- Acceptance uses disposable Knex-migrated databases and runs against both managed .NET and actual NativeAOT, locally and in Docker.
