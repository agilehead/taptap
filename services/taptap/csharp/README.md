# TapTap C# backend

The backend uses the same service-owned directory and dependency model as Ctlflow:

```text
services/taptap/
  csharp/
    apps/TapTap.Server/
    packages/
      TapTap.Kernel/
      TapTap.Domain/
      TapTap.Contracts/
      TapTap.AdapterSqlite/
      TapTap.AdapterRuntime/
      TapTap.AdapterHttp/
      TapTap.AdapterGraphql/
      TapTap.AdapterNotifications/
    build/
      TapTap.EfCompiler/
      TapTap.EfHost/
      NativeQueries.targets
    scripts/generate-model.mjs
    tests/TapTap.ContractProbe/
    Dockerfile
  scripts/
  tests/contracts/
```

The executable delegates startup to the HTTP host. Domain feature modules own immutable records, function-delegate persistence ports, expected failures through `Result<T>`, and cancellation. Adapters implement the ports; EF persistence rows are distinct from domain records. HTTP owns ASP.NET context, identity/tenant extraction and wire validation. The GraphQL adapter is independent of ASP.NET. Runtime settings and composition remain outside the domain. Contracts own generated JSON metadata and wire shapes. Multi-store transactions use the shared `IUnitOfWork.Run` contract; no transaction spans an outbound provider call.

## Storage

Knex in `services/taptap/database/taptap/sqlite/migrations/` remains the sole schema owner. Startup requires an existing absolute database path, enables WAL through the SQLite provider, and opens read/write connections with foreign keys and a busy timeout. It never creates tables, migrates, resets or seeds the schema. Runtime persistence uses EF LINQ and precompiled native queries; application code contains no handwritten SQL command text.

`npm run generate:model` creates a disposable Knex database, checks the Node `DatabaseSchema` contract against every table, column, nullability and key, and generates persistence rows and the EF mapping under `AdapterSqlite/generated/`. `npm run build` runs that generator with `--check`; drift fails the build. These generated files are source artifacts. The design-time EF compiled model and interceptors are rebuildable `obj/` output and are not tracked.

SQLite strings preserve the Node representations: ISO UTC timestamps with milliseconds, nullable fields and stored JSON, hexadecimal queue identifiers, statuses and retry counts. Failed writes detach persistence state so a subsequent operation is not contaminated. Transaction failures roll back.

The pinned SQLite provider's `IRelationalDatabaseCreator.Create` implementation configures WAL on its existing connection; table creation is a separate API. The adapter supplies `ReadWrite` mode and requires an existing absolute file. Acceptance verifies WAL and unchanged schema after initialization.

- [Pinned SQLite provider implementation](https://github.com/dotnet/efcore/blob/v11.0.0-rc.2.26504.105/src/EFCore.Sqlite.Core/Storage/Internal/SqliteDatabaseCreator.cs#L40)

## Native publication

The repository pins .NET 11 RC2 and EF 11 RC2 identically to Snapped. The build-only EF compiler is the same name-normalized implementation, including converter metadata, collection parameter and captured-value fixes. It and Roslyn/design-time dependencies do not enter the application image.

`npm run build:native` sequentially publishes the server and contract probe. Native tests require an ELF header and execute that binary; they do not accept a managed substitute. Application compiler/analyzer warnings are errors. Upstream EF/linker/AOT warnings remain visible under the same policy as Snapped; actual execution of all supported queries and provider paths is required in addition to successful publication.

The Dockerfile defaults to the `nativeaot` target and provides a `managed` target. Both use the same pinned base images as Snapped and expose `/app/taptap health`; the native image contains neither Node nor the managed .NET runtime. Knex has a separate Node image built from `services/taptap/database/Dockerfile` without compiling the comparison server, and the Node comparison Dockerfile remains under `services/taptap/node/Dockerfile`.

## Verification

Run build, lint, native publication and tests in order from the root. Bound the whole process group, for example on this host:

```bash
systemd-run --user --scope --quiet --expand-environment=no \
  -p MemoryMax=8G -p MemorySwapMax=0 -p TasksMax=1024 \
  env DOTNET_PROCESSOR_COUNT=4 npm test
```

The shared HTTP contracts cover normal and malformed inputs, tenant/security boundaries, wire and storage representations, and complete service operations. The C# probe verifies store operations, rollback, retry limits, provider errors and partial progress after infrastructure failure. SMTP tests use local independent protocol/TLS fixtures and Python MIME parsing; they do not send real email. All fixtures live under ignored `.tests/`; schema snapshots prove runtime operations leave Knex ownership intact. Docker acceptance uses the actual `services/taptap/docker/development/docker-compose.yml` with test-owned names and data. Production deployment requires separate authorization and backup verification.
