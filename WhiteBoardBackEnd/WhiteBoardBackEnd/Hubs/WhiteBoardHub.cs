using WhiteBoardBackEnd.DataService;
using WhiteBoardBackEnd.Models;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace WhiteBoardBackEnd.Hubs
{
    public class WhiteBoardHub : Hub
    {
        private readonly SharedDb _sharedDb;

        public WhiteBoardHub(SharedDb sharedDb)
        {
            _sharedDb = sharedDb;
        }

        public async Task JoinWhiteBoard(string userName, string whiteBoard)
        {
            if (string.IsNullOrWhiteSpace(userName))
            {
                await Clients.Caller.SendAsync("ReceiveMessage", "Server", "Invalid user name.");
                return;
            }

            // Lägger till en användare i ett chatroom med hjälp av connection
            await Groups.AddToGroupAsync(Context.ConnectionId, whiteBoard);
            _sharedDb.Connection[Context.ConnectionId] = new UserConnection { UserName = userName, WhiteBoard = whiteBoard};

            await Clients.Group(whiteBoard).SendAsync("ReceiveMessage", "Server", $"{userName} has joined the whiteboard.");
        }

        public async Task QuitWhiteBoard(UserConnection userConnection)
        {
            // Ta bort en user från ett chatroom 
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userConnection.WhiteBoard); 
            _sharedDb.Connection.TryRemove(Context.ConnectionId, out _);

            await Clients.Group(userConnection.WhiteBoard).SendAsync("ReceiveMessage", "Server", $"{userConnection.UserName} has left the whiteboard.");
        }
        public async Task SendMessage(string message, string whiteBoard, string userName)
        {
            await Clients.Group(whiteBoard).SendAsync("ReceiveMessage", userName, message);
        }
        public async Task SendDrawData(float startX, float startY, float endX, float endY, string color, int brushSize)
        {
            if (_sharedDb.Connection.TryGetValue(Context.ConnectionId, out var userConnection) && userConnection.WhiteBoard != null)
            {
                await Clients.OthersInGroup(userConnection.WhiteBoard)
                    .SendAsync("ReceiveDrawData", startX, startY, endX, endY, color, brushSize);
            }
            else
            {
                await Clients.Caller.SendAsync("ReceiveMessage", "Server", "You must join a whiteboard before drawing.");
            }
        }

        public async Task SendCanvasImage(string imageDataUrl)
        {
            if (_sharedDb.Connection.TryGetValue(Context.ConnectionId, out var userConnection) && userConnection.WhiteBoard != null)
            {
                await Clients.OthersInGroup(userConnection.WhiteBoard).SendAsync("ReceiveCanvasImage", imageDataUrl);
            }
            else
            {
                await Clients.Caller.SendAsync("ReceiveMessage", "Server", "You must join a whiteboard before sending canvas image.");
            }
        }

    }
}