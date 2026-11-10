using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;

namespace SchoolAdmission.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<ClassEntity> Classes => Set<ClassEntity>();
    public DbSet<AdmissionHold> Holds => Set<AdmissionHold>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ClassEntity>(entity =>
        {
            entity.ToTable("Classes");

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id)
                .HasMaxLength(64);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.TotalSeats)
                .IsRequired();

            entity.Property(e => e.CreatedAtUtc)
                .IsRequired();

            entity.Property(e => e.UpdatedAtUtc)
                .IsRequired();

            entity.HasMany(e => e.Holds)
                .WithOne(h => h.Class)
                .HasForeignKey(h => h.ClassId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Name);
        });

        modelBuilder.Entity<AdmissionHold>(entity =>
        {
            entity.ToTable("Holds");

            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id)
                .HasMaxLength(64);

            entity.Property(e => e.ClassId)
                .IsRequired()
                .HasMaxLength(64);

            entity.Property(e => e.StudentId)
                .IsRequired()
                .HasMaxLength(17);

            entity.Property(e => e.Status)
                .IsRequired()
                .HasConversion(
                    v => v.ToString(),
                    v => (HoldStatus)Enum.Parse(typeof(HoldStatus), v))
                .HasMaxLength(32);

            entity.Property(e => e.CreatedAtUtc)
                .IsRequired();

            entity.Property(e => e.ExpiresAtUtc)
                .IsRequired();

            entity.Property(e => e.ConfirmedAtUtc);
            entity.Property(e => e.CancelledAtUtc);

            entity.HasIndex(e => new { e.ClassId, e.Status, e.ExpiresAtUtc });
            entity.HasIndex(e => new { e.StudentId, e.Status, e.ExpiresAtUtc });
        });
    }
}
