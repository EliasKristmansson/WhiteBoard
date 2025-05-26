using System.Collections.Concurrent;
using WhiteBoardBackEnd.Models;

namespace WhiteBoardBackEnd.DataService
{
    // Lagrar user connections in memory, pseudo-databas
    public class SharedDb
    {
        private readonly ConcurrentDictionary<string, UserConnection> _connection = new();

        public ConcurrentDictionary<string, UserConnection> Connection => _connection;
    }
}