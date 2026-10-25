using System.Text.Json.Nodes;

namespace TapTap.Contracts;

public sealed record GraphqlRequest(string Query, string? OperationName, JsonObject? Variables);
