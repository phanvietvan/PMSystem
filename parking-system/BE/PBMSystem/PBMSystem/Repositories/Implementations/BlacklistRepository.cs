using Repositories.Entities;
using Repositories.Interfaces;

namespace Repositories.Implementations
{
    public class BlacklistRepository : Repository<BlacklistEntry>, IBlacklistRepository
    {
        public BlacklistRepository(AppDbContext context) : base(context)
        {
        }
    }
}
