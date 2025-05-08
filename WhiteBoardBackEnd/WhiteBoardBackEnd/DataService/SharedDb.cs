using System.Collections.Concurrent;
using WhiteBoardBackEnd.Models;

namespace WhiteBoardBackEnd.DataService
{
    public class SharedDb
    {
        private readonly ConcurrentDictionary<string, UserConnection> _connection = new();

        public ConcurrentDictionary<string, UserConnection> Connection => _connection;
    }
}