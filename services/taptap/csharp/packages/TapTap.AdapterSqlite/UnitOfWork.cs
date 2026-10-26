using TapTap.AdapterSqlite.Entities;
using TapTap.Kernel;

namespace TapTap.AdapterSqlite;

public sealed record UnitOfWork(TapTapDbContext Database) : IUnitOfWork
{
    public Task<Result<T>> Run<T>(Func<CancellationToken, Task<Result<T>>> operation, CancellationToken cancellation) =>
        Storage.Transaction(Database, () => operation(cancellation), cancellation);
}
