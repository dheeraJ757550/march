using march.models;
using Microsoft.EntityFrameworkCore;

namespace march.Data
{
    public class AppDbContext:DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<User> Users { get; set; }
    }
}
