// @ts-nocheck
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedSampleData() {
  try {
    console.log('🌱 Seeding sample data...')

    // Get demo users
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })
    
    const staffUser = await prisma.user.findUnique({
      where: { email: 'staff@example.com' }
    })

    if (!adminUser || !staffUser) {
      console.log('❌ Demo users not found. Please run create-demo-users.ts first')
      return
    }

    // Sample Pay Components
    console.log('📋 Creating sample pay components...')
    const payComponents = [
      { 
        nama: 'Gaji Pokok', 
        tipe: 'EARNING', 
        taxable: true,
        metode: 'FLAT',
        basis: 'UPAH_HARIAN',
        nominal: 5000000,
        aktif: true 
      },
      { 
        nama: 'Tunjangan Transport', 
        tipe: 'EARNING', 
        taxable: false,
        metode: 'FLAT',
        basis: 'UPAH_HARIAN',
        nominal: 500000,
        aktif: true 
      },
      { 
        nama: 'Tunjangan Makan', 
        tipe: 'EARNING', 
        taxable: false,
        metode: 'FLAT',
        basis: 'UPAH_HARIAN',
        nominal: 750000,
        aktif: true 
      },
      { 
        nama: 'Bonus Kinerja', 
        tipe: 'EARNING', 
        taxable: true,
        metode: 'PERSENTASE',
        basis: 'BRUTO',
        rate: 10.0,
        aktif: true 
      },
      { 
        nama: 'Potongan BPJS', 
        tipe: 'DEDUCTION', 
        taxable: false,
        metode: 'PERSENTASE',
        basis: 'BRUTO',
        rate: 4.0,
        aktif: true 
      },
      { 
        nama: 'Potongan PPh21', 
        tipe: 'DEDUCTION', 
        taxable: false,
        metode: 'PERSENTASE',
        basis: 'BRUTO',
        rate: 5.0,
        aktif: true 
      },
    ]

    for (const component of payComponents) {
      const existing = await prisma.payComponent.findFirst({
        where: { nama: component.nama }
      })
      
      if (!existing) {
        await prisma.payComponent.create({ 
          data: {
            ...component,
            tipe: component.tipe as 'EARNING' | 'DEDUCTION'
          }
        })
        console.log(`✅ Created pay component: ${component.nama}`)
      }
    }

    // Sample Employees
    console.log('👥 Creating sample employees...')
    const employees = [
      {
        nik: 'EMP001',
        nama: 'Budi Santoso',
        alamat: 'Jl. Merdeka No. 123, Jakarta',
        tempatLahir: 'Jakarta',
        tanggalLahir: '1985-05-15',
        jabatan: 'Manager Operasional',
        site: 'Jakarta',
        kontrakUpahHarian: 250000,
        defaultUangMakan: 50000,
        defaultUangBbm: 30000,
        bankName: 'BCA',
        bankAccount: '1234567890',
        npwp: '123456789012345',
        startDate: '2020-01-15',
        aktif: true
      },
      {
        nik: 'EMP002',
        nama: 'Siti Nurhaliza',
        alamat: 'Jl. Sudirman No. 456, Jakarta',
        tempatLahir: 'Bandung',
        tanggalLahir: '1990-08-20',
        jabatan: 'Staff Admin',
        site: 'Jakarta',
        kontrakUpahHarian: 200000,
        defaultUangMakan: 45000,
        defaultUangBbm: 25000,
        bankName: 'Mandiri',
        bankAccount: '0987654321',
        npwp: '543210987654321',
        startDate: '2021-03-01',
        aktif: true
      }
    ]

    for (const emp of employees) {
      const existing = await prisma.employee.findFirst({
        where: { nik: emp.nik }
      })
      
      if (!existing) {
        await prisma.employee.create({ data: emp })
        console.log(`✅ Created employee: ${emp.nama} (${emp.nik})`)
      }
    }

    // Sample Kas Kecil Expenses
    console.log('💰 Creating sample kas kecil expenses...')
    const kasKecilExpenses = [
      {
        hari: 'Senin',
        tanggal: '2025-08-28',
        bulan: 'Agustus',
        tipe_aktivitas: 'beli',
        barang: 'Alat Tulis Kantor',
        banyak: 5,
        satuan: 'box',
        harga_satuan: 50000,
        total: 250000,
        vendor_nama: 'Toko Serba Ada',
        vendor_telp: '021-1234567',
        jenis: 'kas_kecil',
        sub_jenis: 'alat_tulis',
        status: 'DRAFT',
        created_by: staffUser.id
      },
      {
        hari: 'Selasa',
        tanggal: '2025-08-27',
        bulan: 'Agustus',
        tipe_aktivitas: 'beli',
        barang: 'BBM Solar untuk Generator',
        banyak: 100,
        satuan: 'liter',
        harga_satuan: 8500,
        total: 850000,
        vendor_nama: 'SPBU Shell',
        vendor_telp: '021-9876543',
        jenis: 'kas_kecil',
        sub_jenis: 'bbm_solar',
        status: 'SUBMITTED',
        created_by: staffUser.id
      }
    ]

    for (const expense of kasKecilExpenses) {
      const existing = await prisma.kasKecilExpense.findFirst({
        where: { 
          tanggal: expense.tanggal,
          barang: expense.barang
        }
      })
      
      if (!existing) {
        await prisma.kasKecilExpense.create({ data: expense })
        console.log(`✅ Created kas kecil expense: ${expense.barang}`)
      }
    }

    // Sample Kas Besar Expenses
    console.log('🏦 Creating sample kas besar expenses...')
    const kasBesarExpenses = [
      {
        hari: 'Rabu',
        tanggal: '2025-08-26',
        bulan: 'Agustus',
        tipe_aktivitas: 'Investasi',
        barang: 'Excavator Caterpillar 320D',
        banyak: 1,
        satuan: 'unit',
        harga_satuan: 2500000000,
        total: 2500000000,
        vendor_nama: 'PT Trakindo Utama',
        vendor_telp: '021-2345678',
        vendor_email: 'sales@trakindo.co.id',
        jenis: 'kas_besar',
        sub_jenis: 'investasi',
        kontrak_url: '',
        bukti_url: '',
        status: 'DRAFT',
        created_by: adminUser.id
      }
    ]

    for (const expense of kasBesarExpenses) {
      const existing = await prisma.kasBesarExpense.findFirst({
        where: { 
          tanggal: expense.tanggal,
          barang: expense.barang
        }
      })
      
      if (!existing) {
        await prisma.kasBesarExpense.create({ data: expense })
        console.log(`✅ Created kas besar expense: ${expense.barang}`)
      }
    }

    console.log('🎉 Sample data seeding complete!')
    console.log('\n📋 Summary:')
    console.log('- Pay Components: Created salary components')
    console.log('- Employees: Created 2 sample employees')
    console.log('- Kas Kecil: Created 2 sample expenses')
    console.log('- Kas Besar: Created 1 sample expense')
    console.log('\n🚀 You can now test the application with sample data!')

  } catch (error) {
    console.error('❌ Error seeding sample data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedSampleData()
    .then(() => {
      console.log('✅ Sample data seeding complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Sample data seeding failed:', error)
      process.exit(1)
    })
}

export { seedSampleData }
