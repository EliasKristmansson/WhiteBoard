using WhiteBoardBackEnd.DataService;
using WhiteBoardBackEnd.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Servicekonfigurationer
builder.Services.AddControllers();

// �ndrar paketstorleken f�r SignalR, kr�vs f�r att skicka bilddata
builder.Services.AddSignalR(options =>
{
    options.MaximumReceiveMessageSize = 1024 * 1024;
});

builder.Services.AddSingleton<SharedDb>();

// L�gger till CORS-konfiguration, vilka dom�ner som har access till v�r backend
builder.Services.AddCors(options =>
{
    options.AddPolicy("reactapp", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173", // localhost f�r utveckling
                "https://eliaskristmansson.github.io", // GitHub pages f�r tempor�r hosting
                "https://whiteboard-frontend-e304.onrender.com") // Render URL f�r permanent hosting
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

    // Hittar en extern milj�variabel PORT fr�n Render i detta fall
    var envPort = Environment.GetEnvironmentVariable("PORT");
    if (!string.IsNullOrEmpty(envPort) && int.TryParse(envPort, out int port))
    {
        // Lyssnar p� porten fr�n Render via HTTP d� HTTPS sk�ts hos Render
        options.ListenAnyIP(port);
    }
    else
    {
        // Fallback f�r lokal utveckling, lokala HTTP och HTTPS-portar
        options.ListenAnyIP(5183);
        options.ListenAnyIP(7264, listenOptions =>
        {
            listenOptions.UseHttps();
        });
    }
});

// F�rdigst�ller applikationen
var app = builder.Build();

// Initialiserar CORS med den tidigare satta konfigurationen
app.UseCors("reactapp");

// Tvingar HTTPS vid f�rs�k till http:// access
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Kopplar SignalR-hub till frontend
app.MapHub<WhiteBoardHub>("/whiteboard");

app.Run();
