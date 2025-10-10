#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Comprehensive Payroll Mockup Data Seeder
 * Creates realistic test data for payroll PDF generation testing
 * Includes: 2 employees, complete pay components, and payroll run
 */
async function seedPayrollMockup() {
  console.log('🌱 Seeding payroll mockup data for PDF testing...\n');

  try {
    // Step 1: Create Pay Components (Komponen Gaji)
    console.log('📋 Creating pay components...');
    
    const payComponents = [
      // EARNINGS (Pendapatan)
      {
        nama: 'Gaji Pokok',
        tipe: 'EARNING',
        metode: 'FIXED',
        basis: 'MONTHLY',
        nominal: 0, // Will be set per employee
        taxable: true,
        order: 1,
        aktif: true
      },
      {
        nama: 'Tunjangan Transport',
        tipe: 'EARNING',
        metode: 'FIXED',
        basis: 'DAILY',
        nominal: 25000,
        taxable: true,
        order: 2,
        aktif: true
      },
      {
        nama: 'Tunjangan Makan',
        tipe: 'EARNING',
        metode: 'FIXED',
        basis: 'DAILY',
        nominal: 35000,
        taxable: true,
        order: 3,
        aktif: true
      },
      {
        nama: 'Tunjangan Kesehatan',
        tipe: 'EARNING',
        metode: 'FIXED',
        basis: 'MONTHLY',
        nominal: 500000,
        taxable: false,
        order: 4,
        aktif: true
      },
      {
        nama: 'Tunjangan Keluarga',
        tipe: 'EARNING',
        metode: 'FIXED',
        basis: 'MONTHLY',
        nominal: 300000,
        taxable: true,
        order: 5,
        aktif: true
      },
      {
        nama: 'Bonus Kinerja',
        tipe: 'EARNING',
        metode: 'VARIABLE',
        basis: 'MONTHLY',
        nominal: 0, // Variable amount
        taxable: true,
        order: 6,
        aktif: true
      },
      {
        nama: 'Lembur',
        tipe: 'EARNING',
        metode: 'HOURLY',
        basis: 'HOURLY',
        rate: 1.5, // 1.5x normal rate
        taxable: true,
        order: 7,
        aktif: true
      },
      {
        nama: 'Tunjangan BBM',
        tipe: 'EARNING',
        metode: 'FIXED',
        basis: 'MONTHLY',
        nominal: 400000,
        taxable: true,
        order: 8,
        aktif: true
      },
      
      // DEDUCTIONS (Potongan)
      {
        nama: 'BPJS Kesehatan (1%)',
        tipe: 'DEDUCTION',
        metode: 'PERCENTAGE',
        basis: 'GROSS',
        rate: 0.01, // 1% of gross salary
        taxable: false,
        order: 20,
        aktif: true
      },
      {
        nama: 'BPJS Ketenagakerjaan (2%)',
        tipe: 'DEDUCTION',
        metode: 'PERCENTAGE',
        basis: 'GROSS',
        rate: 0.02, // 2% of gross salary
        taxable: false,
        order: 21,
        aktif: true
      },
      {
        nama: 'PPh 21',
        tipe: 'DEDUCTION',
        metode: 'PERCENTAGE',
        basis: 'TAXABLE',
        rate: 0.05, // 5% tax rate
        taxable: false,
        order: 22,
        aktif: true
      },
      {
        nama: 'Potongan Kasbon',
        tipe: 'DEDUCTION',
        metode: 'FIXED',
        basis: 'MONTHLY',
        nominal: 0, // Variable amount
        taxable: false,
        order: 23,
        aktif: true
      },
      {
        nama: 'Potongan Keterlambatan',
        tipe: 'DEDUCTION',
        metode: 'FIXED',
        basis: 'MONTHLY',
        nominal: 0, // Variable amount
        taxable: false,
        order: 24,
        aktif: true
      },
      {
        nama: 'Iuran Koperasi',
        tipe: 'DEDUCTION',
        metode: 'FIXED',
        basis: 'MONTHLY',
        nominal: 50000,
        taxable: false,
        order: 25,
        aktif: true
      }
    ];

    // Get admin user for created_by field
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      throw new Error('Admin user not found. Please run seed-users.js first.');
    }

    // Create pay components
    const createdComponents = [];
    for (const component of payComponents) {
      const existing = await prisma.payComponent.findFirst({
        where: { nama: component.nama }
      });

      if (existing) {
        console.log(`⏭️  Component '${component.nama}' already exists, skipping...`);
        createdComponents.push(existing);
        continue;
      }

      const created = await prisma.payComponent.create({
        data: {
          ...component,
          created_by: adminUser.id
        }
      });
      
      createdComponents.push(created);
      console.log(`✅ Created component: ${created.nama}`);
    }

    // Step 2: Create Employees (Karyawan Dummy)
    console.log('\n👥 Creating dummy employees...');
    
    const employees = [
      {
        nama: 'Budi Santoso',
        nik: '3201012345678901',
        jabatan: 'Supervisor Produksi',
        site: 'Site A - Tambang Utama',
        tempatLahir: 'Jakarta',
        tanggalLahir: '1985-03-15',
        alamat: 'Jl. Merdeka No. 123, Jakarta Selatan 12345',
        kontrakUpahHarian: 350000, // Rp 350,000 per hari
        defaultUangMakan: 35000,
        defaultUangBbm: 25000,
        bankName: 'Bank Mandiri',
        bankAccount: '1234567890',
        npwp: '12.345.678.9-012.000',
        startDate: '2020-01-15',
        aktif: true
      },
      {
        nama: 'Siti Nurhaliza',
        nik: '3201012345678902',
        jabatan: 'Operator Alat Berat',
        site: 'Site B - Tambang Eksplorasi',
        tempatLahir: 'Bandung',
        tanggalLahir: '1990-07-22',
        alamat: 'Jl. Sudirman No. 456, Bandung 40123',
        kontrakUpahHarian: 280000, // Rp 280,000 per hari
        defaultUangMakan: 35000,
        defaultUangBbm: 25000,
        bankName: 'Bank BCA',
        bankAccount: '0987654321',
        npwp: '98.765.432.1-098.000',
        startDate: '2021-06-01',
        aktif: true
      }
    ];

    const createdEmployees = [];
    for (const employee of employees) {
      const existing = await prisma.employee.findFirst({
        where: { nama: employee.nama }
      });

      if (existing) {
        console.log(`⏭️  Employee '${employee.nama}' already exists, skipping...`);
        createdEmployees.push(existing);
        continue;
      }

      const created = await prisma.employee.create({
        data: employee
      });
      
      createdEmployees.push(created);
      console.log(`✅ Created employee: ${created.nama} - ${created.jabatan}`);
    }

    // Step 3: Create Payroll Run
    console.log('\n💰 Creating payroll run...');
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const payrollRun = await prisma.payrollRun.create({
      data: {
        periodeAwal: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`,
        periodeAkhir: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`,
        status: 'APPROVED',
        createdBy: adminUser.id,
        approvedBy: adminUser.id,
        notes: 'Payroll mockup data untuk testing PDF generation',
        customFileName: `Payroll_Testing_${currentYear}_${currentMonth.toString().padStart(2, '0')}`
      }
    });

    console.log(`✅ Created payroll run: ${payrollRun.id} for period ${payrollRun.periodeAwal} to ${payrollRun.periodeAkhir}`);

    // Step 4: Create Payroll Lines with realistic data
    console.log('\n📊 Creating payroll lines with calculations...');
    
    const payrollLineData = [
      {
        employee: createdEmployees[0], // Budi Santoso
        hariKerja: 22, // 22 working days
        overtimeHours: 15, // 15 hours overtime
        bonusKinerja: 1000000, // Rp 1,000,000 bonus
        kasbon: 500000, // Rp 500,000 kasbon
        keterlambatan: 50000 // Rp 50,000 penalty
      },
      {
        employee: createdEmployees[1], // Siti Nurhaliza
        hariKerja: 20, // 20 working days (2 days sick leave)
        overtimeHours: 8, // 8 hours overtime
        bonusKinerja: 750000, // Rp 750,000 bonus
        kasbon: 300000, // Rp 300,000 kasbon
        keterlambatan: 0 // No penalty
      }
    ];

    for (const lineData of payrollLineData) {
      const employee = lineData.employee;
      
      // Calculate basic amounts
      const upahPokok = employee.kontrakUpahHarian * lineData.hariKerja;
      const uangMakan = employee.defaultUangMakan * lineData.hariKerja;
      const uangBbm = employee.defaultUangBbm * lineData.hariKerja;
      const overtimeAmount = (employee.kontrakUpahHarian / 8) * 1.5 * lineData.overtimeHours;
      
      // Calculate gross salary
      const bruto = upahPokok + uangMakan + uangBbm + overtimeAmount + lineData.bonusKinerja + 500000 + 300000 + 400000; // Include allowances
      
      // Calculate deductions
      const bpjsKesehatan = bruto * 0.01;
      const bpjsKetenagakerjaan = bruto * 0.02;
      const taxableIncome = bruto - bpjsKesehatan - bpjsKetenagakerjaan;
      const pph21 = taxableIncome * 0.05;
      const totalPotongan = bpjsKesehatan + bpjsKetenagakerjaan + pph21 + lineData.kasbon + lineData.keterlambatan + 50000; // Include koperasi
      
      const neto = bruto - totalPotongan;

      const payrollLine = await prisma.payrollLine.create({
        data: {
          payrollRunId: payrollRun.id,
          employeeId: employee.id,
          employeeName: employee.nama,
          hariKerja: lineData.hariKerja,
          upahHarian: employee.kontrakUpahHarian,
          uangMakanHarian: employee.defaultUangMakan,
          uangBbmHarian: employee.defaultUangBbm,
          overtimeHours: lineData.overtimeHours,
          overtimeRate: 1.5,
          overtimeAmount: overtimeAmount,
          normalHours: lineData.hariKerja * 8,
          cashbon: lineData.kasbon,
          bruto: bruto,
          pajakRate: 0.05,
          pajakNominal: pph21,
          potonganLain: lineData.keterlambatan,
          neto: neto,
          status: 'APPROVED'
        }
      });

      // Create detailed payroll line components
      const componentData = [
        // Earnings
        { componentName: 'Gaji Pokok', amount: upahPokok, taxable: true },
        { componentName: 'Tunjangan Transport', amount: uangBbm, taxable: true },
        { componentName: 'Tunjangan Makan', amount: uangMakan, taxable: true },
        { componentName: 'Tunjangan Kesehatan', amount: 500000, taxable: false },
        { componentName: 'Tunjangan Keluarga', amount: 300000, taxable: true },
        { componentName: 'Bonus Kinerja', amount: lineData.bonusKinerja, taxable: true },
        { componentName: 'Lembur', amount: overtimeAmount, taxable: true },
        { componentName: 'Tunjangan BBM', amount: 400000, taxable: true },
        
        // Deductions
        { componentName: 'BPJS Kesehatan (1%)', amount: -bpjsKesehatan, taxable: false },
        { componentName: 'BPJS Ketenagakerjaan (2%)', amount: -bpjsKetenagakerjaan, taxable: false },
        { componentName: 'PPh 21', amount: -pph21, taxable: false },
        { componentName: 'Potongan Kasbon', amount: -lineData.kasbon, taxable: false },
        { componentName: 'Potongan Keterlambatan', amount: -lineData.keterlambatan, taxable: false },
        { componentName: 'Iuran Koperasi', amount: -50000, taxable: false }
      ];

      for (const compData of componentData) {
        const component = createdComponents.find(c => c.nama === compData.componentName);
        if (component) {
          await prisma.payrollLineComponent.create({
            data: {
              payrollLineId: payrollLine.id,
              componentId: component.id,
              componentName: compData.componentName,
              amount: compData.amount,
              taxable: compData.taxable
            }
          });
        }
      }

      console.log(`✅ Created payroll line for ${employee.nama}:`);
      console.log(`   - Hari Kerja: ${lineData.hariKerja} hari`);
      console.log(`   - Lembur: ${lineData.overtimeHours} jam`);
      console.log(`   - Bruto: Rp ${bruto.toLocaleString('id-ID')}`);
      console.log(`   - Neto: Rp ${neto.toLocaleString('id-ID')}`);
    }

    console.log('\n🎉 Payroll mockup seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`✅ Pay Components: ${createdComponents.length} items`);
    console.log(`✅ Employees: ${createdEmployees.length} people`);
    console.log(`✅ Payroll Run: ${payrollRun.id}`);
    console.log(`✅ Payroll Lines: ${payrollLineData.length} records`);
    console.log('\n🔍 Test Data Details:');
    console.log('👤 Employee 1: Budi Santoso (Supervisor) - 22 hari kerja, 15 jam lembur');
    console.log('👤 Employee 2: Siti Nurhaliza (Operator) - 20 hari kerja, 8 jam lembur');
    console.log('\n📄 Ready for PDF generation testing!');
    console.log(`🆔 Payroll Run ID: ${payrollRun.id}`);

  } catch (error) {
    console.error('❌ Error during payroll mockup seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedPayrollMockup();
}

module.exports = { seedPayrollMockup };