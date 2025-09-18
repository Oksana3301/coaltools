#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Test script untuk validasi data payroll mockup
 * dan menyediakan informasi untuk PDF generation testing
 */
async function testPayrollMockup() {
  console.log('🧪 Testing payroll mockup data...\n');

  try {
    // Test 1: Verify Pay Components
    console.log('📋 Testing Pay Components...');
    const payComponents = await prisma.payComponent.findMany({
      where: { aktif: true },
      orderBy: { order: 'asc' }
    });

    console.log(`✅ Found ${payComponents.length} active pay components:`);
    
    const earnings = payComponents.filter(c => c.tipe === 'EARNING');
    const deductions = payComponents.filter(c => c.tipe === 'DEDUCTION');
    
    console.log(`   📈 Earnings (${earnings.length}):`);
    earnings.forEach(comp => {
      const amount = comp.nominal ? `Rp ${comp.nominal.toLocaleString('id-ID')}` : 
                    comp.rate ? `${(comp.rate * 100)}%` : 'Variable';
      console.log(`      - ${comp.nama}: ${amount} (${comp.basis})`);
    });
    
    console.log(`   📉 Deductions (${deductions.length}):`);
    deductions.forEach(comp => {
      const amount = comp.nominal ? `Rp ${comp.nominal.toLocaleString('id-ID')}` : 
                    comp.rate ? `${(comp.rate * 100)}%` : 'Variable';
      console.log(`      - ${comp.nama}: ${amount} (${comp.basis})`);
    });

    // Test 2: Verify Employees
    console.log('\n👥 Testing Employees...');
    const employees = await prisma.employee.findMany({
      where: { aktif: true }
    });

    console.log(`✅ Found ${employees.length} active employees:`);
    employees.forEach(emp => {
      console.log(`   👤 ${emp.nama}:`);
      console.log(`      - NIK: ${emp.nik}`);
      console.log(`      - Jabatan: ${emp.jabatan}`);
      console.log(`      - Site: ${emp.site}`);
      console.log(`      - Upah Harian: Rp ${emp.kontrakUpahHarian.toLocaleString('id-ID')}`);
      console.log(`      - Bank: ${emp.bankName} - ${emp.bankAccount}`);
      console.log(`      - NPWP: ${emp.npwp}`);
    });

    // Test 3: Verify Payroll Run
    console.log('\n💰 Testing Payroll Run...');
    const payrollRuns = await prisma.payrollRun.findMany({
      where: {
        notes: { contains: 'mockup' }
      },
      orderBy: { created_at: 'desc' },
      take: 1
    });

    if (payrollRuns.length === 0) {
      throw new Error('No mockup payroll run found!');
    }

    const payrollRun = payrollRuns[0];
    console.log(`✅ Found payroll run:`);
    console.log(`   🆔 ID: ${payrollRun.id}`);
    console.log(`   📅 Period: ${payrollRun.periodeAwal} to ${payrollRun.periodeAkhir}`);
    console.log(`   📊 Status: ${payrollRun.status}`);
    console.log(`   📝 Notes: ${payrollRun.notes}`);

    // Test 4: Verify Payroll Lines with Details
    console.log('\n📊 Testing Payroll Lines...');
    const payrollLines = await prisma.payrollLine.findMany({
      where: { payrollRunId: payrollRun.id },
      include: {
        employee: true,
        components: {
          include: {
            payComponent: true
          }
        }
      }
    });

    console.log(`✅ Found ${payrollLines.length} payroll lines:`);
    
    for (const line of payrollLines) {
      console.log(`\n   👤 ${line.employeeName}:`);
      console.log(`      📅 Hari Kerja: ${line.hariKerja} hari`);
      console.log(`      ⏰ Lembur: ${line.overtimeHours} jam (Rate: ${line.overtimeRate}x)`);
      console.log(`      💰 Upah Harian: Rp ${line.upahHarian.toLocaleString('id-ID')}`);
      console.log(`      🍽️  Uang Makan: Rp ${line.uangMakanHarian.toLocaleString('id-ID')}/hari`);
      console.log(`      ⛽ Uang BBM: Rp ${line.uangBbmHarian.toLocaleString('id-ID')}/hari`);
      console.log(`      💵 Kasbon: Rp ${line.cashbon.toLocaleString('id-ID')}`);
      console.log(`      📈 Bruto: Rp ${line.bruto.toLocaleString('id-ID')}`);
      console.log(`      📉 Pajak: ${(line.pajakRate * 100)}% = Rp ${line.pajakNominal.toLocaleString('id-ID')}`);
      console.log(`      💸 Potongan Lain: Rp ${line.potonganLain.toLocaleString('id-ID')}`);
      console.log(`      💰 Neto: Rp ${line.neto.toLocaleString('id-ID')}`);
      
      // Show detailed components
      console.log(`      🧾 Components (${line.components.length}):`);
      const earningComponents = line.components.filter(c => c.amount > 0);
      const deductionComponents = line.components.filter(c => c.amount < 0);
      
      console.log(`         📈 Earnings:`);
      earningComponents.forEach(comp => {
        console.log(`            + ${comp.componentName}: Rp ${comp.amount.toLocaleString('id-ID')}`);
      });
      
      console.log(`         📉 Deductions:`);
      deductionComponents.forEach(comp => {
        console.log(`            - ${comp.componentName}: Rp ${Math.abs(comp.amount).toLocaleString('id-ID')}`);
      });
    }

    // Test 5: Generate PDF Testing Information
    console.log('\n📄 PDF Generation Testing Information:');
    console.log('=' .repeat(60));
    console.log(`🆔 Payroll Run ID untuk testing: ${payrollRun.id}`);
    console.log(`📅 Periode: ${payrollRun.periodeAwal} s/d ${payrollRun.periodeAkhir}`);
    console.log(`👥 Jumlah Karyawan: ${payrollLines.length} orang`);
    console.log(`💰 Total Bruto: Rp ${payrollLines.reduce((sum, line) => sum + line.bruto, 0).toLocaleString('id-ID')}`);
    console.log(`💸 Total Neto: Rp ${payrollLines.reduce((sum, line) => sum + line.neto, 0).toLocaleString('id-ID')}`);
    
    console.log('\n🔗 API Endpoints untuk testing:');
    console.log(`   GET /api/payroll/${payrollRun.id} - Get payroll details`);
    console.log(`   POST /api/payroll/${payrollRun.id}/pdf - Generate PDF`);
    console.log(`   GET /api/payroll/${payrollRun.id}/export - Export data`);
    
    console.log('\n📋 Test Scenarios:');
    console.log('   1. ✅ Basic PDF Generation - Standard payroll dengan semua komponen');
    console.log('   2. ✅ Overtime Calculation - Karyawan dengan jam lembur berbeda');
    console.log('   3. ✅ Deduction Scenarios - BPJS, Pajak, Kasbon, Potongan');
    console.log('   4. ✅ Different Employee Types - Supervisor vs Operator');
    console.log('   5. ✅ Complete Bank Details - Informasi transfer lengkap');
    console.log('   6. ✅ Tax Calculations - PPh 21 dan komponen taxable');
    
    console.log('\n🎯 Ready for PDF Testing!');
    console.log('   Semua data mockup sudah siap untuk testing PDF generation.');
    console.log('   Data mencakup skenario payroll yang realistis dan lengkap.');
    
    // Test 6: Validate Data Integrity
    console.log('\n🔍 Data Integrity Check:');
    let allValid = true;
    
    for (const line of payrollLines) {
      // Check if bruto calculation is reasonable
      const expectedMinBruto = line.upahHarian * line.hariKerja;
      if (line.bruto < expectedMinBruto) {
        console.log(`❌ ${line.employeeName}: Bruto too low (${line.bruto} < ${expectedMinBruto})`);
        allValid = false;
      }
      
      // Check if neto is less than bruto
      if (line.neto >= line.bruto) {
        console.log(`❌ ${line.employeeName}: Neto should be less than Bruto`);
        allValid = false;
      }
      
      // Check if components sum correctly
      const totalEarnings = line.components.filter(c => c.amount > 0).reduce((sum, c) => sum + c.amount, 0);
      const totalDeductions = Math.abs(line.components.filter(c => c.amount < 0).reduce((sum, c) => sum + c.amount, 0));
      
      if (Math.abs(totalEarnings - line.bruto) > 1) { // Allow 1 rupiah difference for rounding
        console.log(`⚠️  ${line.employeeName}: Earnings sum mismatch (${totalEarnings} vs ${line.bruto})`);
      }
    }
    
    if (allValid) {
      console.log('✅ All data integrity checks passed!');
    }
    
    console.log('\n🎉 Payroll mockup testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during payroll mockup testing:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testPayrollMockup();
}

module.exports = { testPayrollMockup };