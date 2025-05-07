using ChatApp.DataService;
using ChatApp.Models;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace ChatApp.Hubs
{
    public class ChatHub : Hub
    {
        private readonly SharedDb _sharedDb;

        public ChatHub(SharedDb sharedDb)
        {
            _sharedDb = sharedDb;
        }

        public async Task JoinChatRoom(string userName, string chatRoom, string chatRole)
        {
            // Lägger till en användare i ett chatroom med hjälp av connection
            await Groups.AddToGroupAsync(Context.ConnectionId, chatRoom);
            _sharedDb.Connection[Context.ConnectionId] = new UserConnection { UserName = userName, ChatRoom = chatRoom, ChatRole = chatRole};

            await Clients.Group(chatRoom).SendAsync("ReceiveMessage", "admin", $"{userName} ({chatRole}), has joined the chat room {chatRoom}.");
        }

        public async Task QuitChatRoom(UserConnection connection)
        {
            // Ta bort en user från ett chatroom 
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, connection.ChatRoom);
            await Clients.Group(connection.ChatRoom).SendAsync("ReceiveMessage", "admin", $"{connection.UserName} ({connection.ChatRole}), has left the chat room {connection.ChatRoom}.");
        }

        public async Task SendMessage(string chatRoom, string userName, string message)
        {
            // Skickar ett meddelande i ett chatroom
            await Clients.Group(chatRoom).SendAsync("ReceiveMessage", userName, message);
        }

    }
}