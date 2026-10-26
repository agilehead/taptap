using GraphQL;
using GraphQL.Execution;

namespace TapTap.AdapterGraphql;

public sealed class RepositoryExecuter : DocumentExecuter
{
    protected override IExecutionStrategy SelectExecutionStrategy(GraphQL.Execution.ExecutionContext context) =>
        SerialExecutionStrategy.Instance;
}
