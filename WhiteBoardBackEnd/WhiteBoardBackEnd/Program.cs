using WhiteBoardBackEnd.DataService;
using WhiteBoardBackEnd.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Register services
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddSingleton<SharedDb>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("reactapp", builder =>
    {
        builder.WithOrigins("http://localhost:5173")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("reactapp");
app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();
app.MapHub<WhiteBoardHub>("/whiteboard");

app.Run();

// Snus <3