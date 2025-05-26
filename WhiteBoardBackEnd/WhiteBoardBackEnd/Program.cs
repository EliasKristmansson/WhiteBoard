using WhiteBoardBackEnd.DataService;
using WhiteBoardBackEnd.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Servicekonfigurationer
builder.Services.AddControllers();

// Ändrar paketstorleken för SignalR, krävs för att skicka bilddata
builder.Services.AddSignalR(options =>
{
    options.MaximumReceiveMessageSize = 1024 * 1024;
});

builder.Services.AddSingleton<SharedDb>();

// Lägger till CORS-konfiguration, vilka domäner som har access till vår backend
builder.Services.AddCors(options =>
{
    options.AddPolicy("reactapp", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173", // localhost för utveckling
                "https://eliaskristmansson.github.io", // GitHub pages för temporär hosting
                "https://whiteboard-frontend-e304.onrender.com") // Render URL för permanent hosting
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Konfiguration av Kestrel
builder.WebHost.ConfigureKestrel(options =>
{
    // Inaktiverar kestrels standardbeteende
    options.AddServerHeader = false;

    // Hittar en extern miljövariabel PORT från Render i detta fall
    var envPort = Environment.GetEnvironmentVariable("PORT");
    if (!string.IsNullOrEmpty(envPort) && int.TryParse(envPort, out int port))
    {
        // Lyssnar på porten från Render via HTTP då HTTPS sköts hos Render
        options.ListenAnyIP(port);
    }
    else
    {
        // Fallback för lokal utveckling, lokala HTTP och HTTPS-portar
        options.ListenAnyIP(5183);
        options.ListenAnyIP(7264, listenOptions =>
        {
            listenOptions.UseHttps();
        });
    }
});

// Färdigställer applikationen
var app = builder.Build();

// Initialiserar CORS med den tidigare satta konfigurationen
app.UseCors("reactapp");

// Tvingar HTTPS vid försök till http:// access
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Kopplar SignalR-hub till frontend
app.MapHub<WhiteBoardHub>("/whiteboard");

app.Run();
