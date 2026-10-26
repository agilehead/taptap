namespace TapTap.AdapterRuntime;

public sealed record Settings(string Host, int Port, string DatabasePath, string CronSecret,
    string[] CorsOrigins, string EmailProvider, string FromAddress, string FromName,
    string SmtpHost, int SmtpPort, bool SmtpSecure, string SmtpUser, string SmtpPassword,
    int BatchSize, int MaxAttempts, bool Production)
{
    public static Settings Read()
    {
        var provider = Optional("TAPTAP_EMAIL_PROVIDER", "console");
        if (provider is not ("smtp" or "console")) throw new ArgumentException("TAPTAP_EMAIL_PROVIDER must be console or smtp");
        return new Settings(Required("TAPTAP_SERVER_HOST"), Number("TAPTAP_SERVER_PORT", 5006, 65535),
            Path.GetFullPath(Path.Combine(Required("TAPTAP_DATA_DIR"), "taptap.db")), Required("TAPTAP_CRON_SECRET"),
            Required("TAPTAP_CORS_ORIGINS").Split(',').Select(value => value.Trim()).ToArray(), provider,
            Required("TAPTAP_EMAIL_FROM_ADDRESS"), Required("TAPTAP_EMAIL_FROM_NAME"),
            provider == "smtp" ? Required("TAPTAP_SMTP_HOST") : "", provider == "smtp" ? Number("TAPTAP_SMTP_PORT", 587, 65535) : 587,
            provider == "smtp" && Optional("TAPTAP_SMTP_SECURE", "false") == "true",
            provider == "smtp" ? Required("TAPTAP_SMTP_USER") : "", provider == "smtp" ? Required("TAPTAP_SMTP_PASSWORD") : "",
            Number("TAPTAP_QUEUE_BATCH_SIZE", 10), Number("TAPTAP_QUEUE_MAX_ATTEMPTS", 3),
            Environment.GetEnvironmentVariable("NODE_ENV") == "production");
    }
    public static string Required(string name) => Environment.GetEnvironmentVariable(name) is { Length: > 0 } value
        ? value : throw new ArgumentException("Required environment variable " + name + " is not set");
    public static string Optional(string name, string value) => Environment.GetEnvironmentVariable(name) is { Length: > 0 } text ? text : value;
    public static int Number(string name, int fallback, int maximum = int.MaxValue) =>
        int.TryParse(Optional(name, fallback.ToString(System.Globalization.CultureInfo.InvariantCulture)), out var value) && value > 0 && value <= maximum
            ? value : throw new ArgumentException("Invalid " + name);
}
