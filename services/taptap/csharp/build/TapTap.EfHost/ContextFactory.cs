using TapTap.AdapterSqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Query;

namespace TapTap.EfHost;

public sealed class TapTapDbContextFactory : IDesignTimeDbContextFactory<TapTapDbContext>
{
    public TapTapDbContext CreateDbContext(string[] arguments) => new(
        new DbContextOptionsBuilder<TapTapDbContext>().UseSqlite("Data Source=:memory:")
            .ReplaceService<IRelationalParameterBasedSqlProcessorFactory, PrecompiledSqlParameterFactory>()
            .ReplaceService<IQuerySqlGeneratorFactory, NativeSqlGeneratorFactory>().Options);
}
