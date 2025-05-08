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
            // Lägger till en användare i ett chatroom med hjälp av connection
            await Groups.AddToGroupAsync(Context.ConnectionId, whiteBoard);
            _sharedDb.Connection[Context.ConnectionId] = new UserConnection { UserName = userName, WhiteBoard = whiteBoard};

            await Clients.Group(whiteBoard).SendAsync("ReceiveMessage", $"username: {userName}, whiteboard: {whiteBoard}), hello bro");
        }

        public async Task QuitWhiteBoard(UserConnection userConnection)
        {
            // Ta bort en user från ett chatroom 
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userConnection.WhiteBoard); 
            _sharedDb.Connection.TryRemove(Context.ConnectionId, out _);

            await Clients.Group(userConnection.WhiteBoard).SendAsync("ReceiveMessage", $"username: {userConnection.UserName}, {userConnection.WhiteBoard} goodbye little bro :(.");
        }
        public async Task ConnectWhiteBoard(string userName, string whiteBoard)
        {
            // Skickar ett meddelande i ett chatroom
            await Clients.Group(whiteBoard).SendAsync("ReceiveMessage", userName, whiteBoard);
        }
    }
}