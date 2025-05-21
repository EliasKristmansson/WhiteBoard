using WhiteBoardBackEnd.DataService;
using WhiteBoardBackEnd.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Register services
builder.Services.AddControllers();
builder.Services.AddSignalR(options =>
{
    options.MaximumReceiveMessageSize = 1024 * 1024; // 1 MB
});

builder.Services.AddSingleton<SharedDb>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("reactapp", builder =>
    {
        builder.WithOrigins("http://localhost:5173", "https://eliaskristmansson.github.io")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
    options.ListenAnyIP(5000); // Allow HTTP on port 5000
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("reactapp", policy =>
    {
        policy
            .WithOrigins("https://whiteboard-frontend-e304.onrender.com") // your real frontend URL
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});


var app = builder.Build();

builder.WebHost.UseUrls("http://0.0.0.0:" + Environment.GetEnvironmentVariable("PORT"));



app.UseCors("reactapp");
app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();
app.UseCors("reactapp");
app.MapHub<WhiteBoardHub>("/whiteboard");

app.Run();

// Snus <3