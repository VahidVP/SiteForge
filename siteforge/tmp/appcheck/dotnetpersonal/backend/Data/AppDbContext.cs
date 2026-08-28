using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Page> Pages => Set<Page>();
    public DbSet<OwnerToken> OwnerTokens => Set<OwnerToken>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<User> Users => Set<User>();

    public DbSet<Token> Tokens => Set<Token>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Page>().HasIndex(p => p.Slug).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
    }
}
