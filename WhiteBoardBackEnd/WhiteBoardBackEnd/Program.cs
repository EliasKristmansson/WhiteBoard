using WhiteBoardBackEnd.DataService;
using WhiteBoardBackEnd.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Usual service registrations
builder.Services.AddControllers();
builder.Services.AddSignalR(options =>
{
    options.MaximumReceiveMessageSize = 1024 * 1024;
});
builder.Services.AddSingleton<SharedDb>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("reactapp", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "https://eliaskristmansson.github.io",
                "https://whiteboard-frontend-e304.onrender.com")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Configure Kestrel for dynamic port or fallback ports
builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;

    var envPort = Environment.GetEnvironmentVariable("PORT");
    if (!string.IsNullOrEmpty(envPort) && int.TryParse(envPort, out int port))
    {
        // On Render or any environment with PORT set, listen on that port (HTTP only)
        options.ListenAnyIP(port);
    }
    else
    {
        // Local development: listen on HTTP and HTTPS with fixed ports
        options.ListenAnyIP(5183);
        options.ListenAnyIP(7264, listenOptions =>
        {
            listenOptions.UseHttps();
        });
    }
});

var app = builder.Build();

app.UseCors("reactapp");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.MapHub<WhiteBoardHub>("/whiteboard");

app.Run();
