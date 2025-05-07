using ChatApp.DataService;
using ChatApp.Models;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace ChatApp.Hubs
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

            await Clients.Group(whiteBoard).SendAsync("ReceiveMessage", "hello little bro.");
        }

        public async Task QuitWhiteBoard(UserConnection connection)
        {
            // Ta bort en user från ett chatroom 
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, connection.WhiteBoard);
            await Clients.Group(connection.WhiteBoard).SendAsync("ReceiveMessage", "goodbye little bro :(.");
        }
    }
}