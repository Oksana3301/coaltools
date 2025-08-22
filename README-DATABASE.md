# Database Setup Guide

## Langkah 1: Environment Variables

Buat file `.env` di root project dengan konfigurasi berikut:

```bash
# Database Configuration
# Pilih salah satu dari opsi di bawah ini:

# Option 1: PostgreSQL Lokal
DATABASE_URL="postgresql://username:password@localhost:5432/test_app_db"

# Option 2: Supabase (Recommended untuk development)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Option 3: Railway
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/railway"

# Option 4: Neon
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/[DB]?sslmode=require"

# Next.js Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Langkah 2: Generate Prisma Client

```bash
npx prisma generate
```

## Langkah 3: Push Schema ke Database

```bash
npx prisma db push
```

## Langkah 4: (Optional) Seed Database dengan Data Sample

Buat file `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a demo user
  const demoUser = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'admin'
    }
  })

  // Create sample kas besar expenses
  await prisma.kasBesarExpense.createMany({
    data: [
      {
        hari: 'Senin',
        tanggal: '2024-01-15',
        bulan: 'Januari',
        tipeAktivitas: 'pembelian_aset',
        barang: 'Excavator Caterpillar 320D',
        banyak: 1,
        satuan: 'unit',
        hargaSatuan: 2500000000,
        total: 2500000000,
        vendorNama: 'PT Heavy Equipment Indonesia',
        vendorTelp: '021-1234567',
        vendorEmail: 'sales@heavyequipment.co.id',
        jenis: 'kas_besar',
        subJenis: 'alat_berat',
        kontrakUrl: 'https://example.com/contract1.pdf',
        status: 'APPROVED',
        createdBy: demoUser.id
      },
      {
        hari: 'Selasa',
        tanggal: '2024-01-16',
        bulan: 'Januari',
        tipeAktivitas: 'kontrak_jasa',
        barang: 'Jasa Maintenance Alat Berat - 6 Bulan',
        banyak: 6,
        satuan: 'bulan',
        hargaSatuan: 50000000,
        total: 300000000,
        vendorNama: 'PT Maintenance Pro',
        vendorTelp: '021-7654321',
        vendorEmail: 'service@maintenancepro.co.id',
        jenis: 'kas_besar',
        subJenis: 'kontrak_vendor',
        kontrakUrl: 'https://example.com/contract2.pdf',
        status: 'DRAFT',
        createdBy: demoUser.id
      }
    ]
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Jalankan seeder:

```bash
npx tsx prisma/seed.ts
```

## Langkah 5: Prisma Studio (Optional)

Untuk melihat dan mengedit data di browser:

```bash
npx prisma studio
```

## Rekomendasi Database Provider

### 1. Supabase (Paling Mudah)
- Free tier: 500MB storage, 2 concurrent connections
- Sudah include auth, real-time subscriptions
- Dashboard yang bagus
- Setup: https://supabase.com/

### 2. Railway (Good for production)
- Free tier: $5 credit per month
- Easy deployment
- Good performance
- Setup: https://railway.app/

### 3. Neon (Serverless PostgreSQL)
- Free tier: 3GB storage
- Serverless, auto-scaling
- Good for modern apps
- Setup: https://neon.tech/

### 4. Local PostgreSQL (Development)
```bash
# Install PostgreSQL locally
brew install postgresql
brew services start postgresql

# Create database
createdb test_app_db
```

## Troubleshooting

### Error: "Column does not exist"
```bash
npx prisma db push --force-reset
```

### Error: "Environment variable not found"
Pastikan file `.env` ada dan DATABASE_URL sudah di-set.

### Error: "Cannot connect to database"
- Check koneksi internet
- Pastikan database server running
- Verifikasi credentials di DATABASE_URL

## Next Steps

Setelah database setup:

1. Jalankan development server:
```bash
npm run dev
```

2. Buka http://localhost:3000/coal-tools dan test "Tambah Kas Besar"

3. Data akan tersimpan di database dan bisa di-share antar browser/device

4. Monitor database di Prisma Studio atau provider dashboard

## Production Deployment

Untuk production, pastikan:

1. Use production DATABASE_URL
2. Set NEXTAUTH_SECRET ke random string yang aman
3. Enable SSL untuk database connection
4. Setup backup strategy
5. Monitor database performance
