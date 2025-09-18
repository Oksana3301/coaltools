import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPayrollData() {
  try {
    console.log('🌱 Seeding payroll data...')

    // Create demo user if not exists
    let demoUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' }
    })

    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: {
          name: 'Demo User',
          email: 'demo@example.com',
          password: 'demo123',
          role: 'ADMIN'
        }
      })
      console.log('✅ Created demo user')
    }

    // Create sample employees
    const employees = [
      {
        nama: 'Budi Santoso',
        jabatan: 'Operator Alat Berat',
        site: 'Site A',
        kontrakUpahHarian: 120000,
        defaultUangMakan: 20000,
        defaultUangBbm: 15000,
        bankName: 'BCA',
        bankAccount: '1234567890',
        aktif: true
      },
      {
        nama: 'Siti Aminah',
        jabatan: 'Supervisor Lapangan',
        site: 'Site A',
        kontrakUpahHarian: 150000,
        defaultUangMakan: 25000,
        defaultUangBbm: 20000,
        bankName: 'Mandiri',
        bankAccount: '0987654321',
        aktif: true
      },
      {
        nama: 'Ahmad Rahman',
        jabatan: 'Driver Dump Truck',
        site: 'Site B',
        kontrakUpahHarian: 100000,
        defaultUangMakan: 20000,
        defaultUangBbm: 15000,
        bankName: 'BRI',
        bankAccount: '5555666677',
        aktif: true
      }
    ]

    // Create employees if they don't exist
    for (const employeeData of employees) {
      const existing = await prisma.employee.findFirst({
        where: { nama: employeeData.nama }
      })

      if (!existing) {
        await prisma.employee.create({
          data: employeeData
        })
        console.log(`✅ Created employee: ${employeeData.nama}`)
      }
    }

    // Create sample pay components
    const payComponents = [
      {
        nama: 'Tunjangan Lapangan',
        tipe: 'EARNING' as const,
        taxable: true,
        metode: 'PER_HARI' as const,
        basis: 'HARI_KERJA' as const,
        rate: 25000,
        order: 1,
        aktif: true
      },
      {
        nama: 'Transport Tambahan',
        tipe: 'EARNING' as const,
        taxable: false,
        metode: 'FLAT' as const,
        basis: 'UPAH_HARIAN' as const,
        nominal: 150000,
        order: 2,
        aktif: true
      },
      {
        nama: 'Potongan Kasbon',
        tipe: 'DEDUCTION' as const,
        taxable: false,
        metode: 'FLAT' as const,
        basis: 'UPAH_HARIAN' as const,
        nominal: 300000,
        capMax: 300000,
        order: 3,
        aktif: true
      },
      {
        nama: 'Lembur',
        tipe: 'EARNING' as const,
        taxable: true,
        metode: 'PER_HARI' as const,
        basis: 'UPAH_HARIAN' as const,
        rate: 15000,
        order: 4,
        aktif: true
      }
    ]

    // Create pay components if they don't exist
    for (const componentData of payComponents) {
      const existing = await prisma.payComponent.findFirst({
        where: { nama: componentData.nama }
      })

      if (!existing) {
        await prisma.payComponent.create({
          data: componentData
        })
        console.log(`✅ Created pay component: ${componentData.nama}`)
      }
    }

    console.log('🎉 Payroll data seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding payroll data:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedPayrollData()
}

export { seedPayrollData }
