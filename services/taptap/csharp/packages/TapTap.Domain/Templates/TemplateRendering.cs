using TapTap.Domain.Templates;
using TapTap.Domain.Queue;
using TapTap.Domain.Throttling;
using TapTap.Domain.Notifications;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace TapTap.Domain.Templates;

public static partial class TemplateRendering
{
    public static string Render(string template, JsonElement variables) => Placeholder().Replace(template, match =>
    {
        if (variables.ValueKind == JsonValueKind.Null)
            throw new JsonException("Cannot read properties of null");
        var name = match.Groups[1].Value;
        if (variables.ValueKind == JsonValueKind.Object && variables.TryGetProperty(name, out var value))
            return JavascriptString(value);
        if (int.TryParse(name, out var index) && index >= 0 && name == index.ToString(System.Globalization.CultureInfo.InvariantCulture))
        {
            if (variables.ValueKind == JsonValueKind.Array && index < variables.GetArrayLength()) return JavascriptString(variables[index]);
            if (variables.ValueKind == JsonValueKind.String && index < variables.GetString()!.Length) return variables.GetString()![index].ToString();
        }
        return "";
    });

    private static string JavascriptString(JsonElement value) => value.ValueKind switch
    {
        JsonValueKind.Null or JsonValueKind.Undefined => "",
        JsonValueKind.String => value.GetString()!,
        JsonValueKind.True => "true", JsonValueKind.False => "false",
        JsonValueKind.Array => string.Join(',', value.EnumerateArray().Select(JavascriptString)),
        JsonValueKind.Object => "[object Object]",
        _ => value.GetRawText()
    };
    [GeneratedRegex(@"\{\{([A-Za-z0-9_]+)\}\}", RegexOptions.CultureInvariant)]
    private static partial Regex Placeholder();
}
