import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { Prisma } from '@prisma/client'
import { getPrismaClient } from '@/lib/db'

// Use getPrismaClient from shared db module
const prisma = getPrismaClient()

// Schema untuk validasi input employee
const employeeSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  nik: z.string().optional(),
  jabatan: z.string().min(1, 'Jabatan wajib diisi').max(50, 'Jabatan maksimal 50 karakter'),
  site: z.string().min(1, 'Site wajib diisi').max(50, 'Site maksimal 50 karakter'),
  tempatLahir: z.string().max(50, 'Tempat lahir maksimal 50 karakter').optional(),
  tanggalLahir: z.string().optional(),
  alamat: z.string().max(200, 'Alamat maksimal 200 karakter').optional(),
  kontrakUpahHarian: z.number().min(0, 'Upah harian harus positif').max(10000000, 'Upah harian maksimal Rp 10.000.000'),
  defaultUangMakan: z.number().min(0, 'Uang makan harus positif').max(1000000, 'Uang makan maksimal Rp 1.000.000'),
  defaultUangBbm: z.number().min(0, 'Uang BBM harus positif').max(1000000, 'Uang BBM maksimal Rp 1.000.000'),
  bankName: z.string().max(50, 'Nama bank maksimal 50 karakter').optional(),
  bankAccount: z.string().max(30, 'Nomor rekening maksimal 30 karakter').optional(),
  npwp: z.string().max(20, 'NPWP maksimal 20 karakter').optional(),
  startDate: z.string().optional(),
  aktif: z.boolean().default(true)
})

// Schema untuk update employee (semua field optional kecuali id)
const updateEmployeeSchema = employeeSchema.partial().extend({
  id: z.string().min(1, 'ID wajib diisi')
})

// GET - Ambil semua karyawan
export async function GET(request: NextRequest) {
    // prisma already initialized above
    if (!prisma) {
      logger.error('Database connection not available for GET /api/employees')
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }


  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search') || ''
    const aktif = searchParams.get('aktif')
    
    logger.info('GET /api/employees - Request parameters', { page, limit, search, aktif })

    // Validasi parameter
    if (page < 1 || limit < 1 || limit > 100) {
      logger.warn('Invalid pagination parameters', { page, limit })
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter pagination tidak valid (page >= 1, limit 1-100)'
        },
        { status: 400 }
      )
    }
    
    const skip = (page - 1) * limit

    const where = {
      ...(search && {
        OR: [
          { nama: { contains: search, mode: 'insensitive' as const } },
          { nik: { contains: search, mode: 'insensitive' as const } },
          { jabatan: { contains: search, mode: 'insensitive' as const } },
          { site: { contains: search, mode: 'insensitive' as const } }
        ]
      }),
      ...(aktif !== null && { aktif: aktif === 'true' })
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nama: 'asc' }
      }),
      prisma.employee.count({ where })
    ])

    logger.info('GET /api/employees - Success', { 
      employeesCount: employees.length, 
      total, 
      page, 
      limit 
    })

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    logger.error('Error fetching employees:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data karyawan'
      },
      { status: 500 }
    )
  }
}

// POST - Tambah karyawan baru
export async function POST(request: NextRequest) {
    // prisma already initialized above
    if (!prisma) {
      logger.error('Database connection not available for POST /api/employees')
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }


  try {
    const body = await request.json()
    logger.info('POST /api/employees - Request body received', { bodyKeys: Object.keys(body) })
    
    const validatedData = employeeSchema.parse(body)

    // Cek duplikasi NIK jika NIK disediakan
    if (validatedData.nik) {
      const existingNik = await prisma.employee.findFirst({
        where: { nik: validatedData.nik }
      })

      if (existingNik) {
        logger.warn('Duplicate NIK attempted in employee creation', { nik: validatedData.nik })
        return NextResponse.json(
          {
            success: false,
            error: 'NIK sudah digunakan oleh karyawan lain'
          },
          { status: 409 }
        )
      }
    }

    const employee = await prisma.employee.create({
      data: validatedData
    })

    logger.info('Employee created successfully', { 
      id: employee.id, 
      nama: employee.nama, 
      nik: employee.nik 
    })

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Karyawan berhasil ditambahkan'
    }, { status: 201 })
  } catch (error) {
    logger.error('Error creating employee:', error)
    
    if (error instanceof z.ZodError) {
      logger.warn('Validation error in POST /api/employees', { errors: error.errors })
      return NextResponse.json(
        {
          success: false,
          error: 'Data tidak valid',
          details: error.errors
        },
        { status: 400 }
      )
    }

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        logger.warn('Unique constraint violation in employee creation', { error: error.message })
        return NextResponse.json(
          {
            success: false,
            error: 'Data sudah ada (duplikasi)'
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menambahkan karyawan'
      },
      { status: 500 }
    )
  }
}

// PUT - Update karyawan
export async function PUT(request: NextRequest) {
    // prisma already initialized at top of file
    if (!prisma) {
      logger.error('Database connection not available for PUT /api/employees')
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    
  try {
    const body = await request.json()
    logger.info('PUT /api/employees - Request body received', { bodyKeys: Object.keys(body) })
    
    // Validasi menggunakan updateEmployeeSchema yang sudah include id
    const validatedData = updateEmployeeSchema.parse(body)
    const { id, ...updateData } = validatedData

    // Cek apakah employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      logger.warn('Employee not found for update', { id })
      return NextResponse.json(
        {
          success: false,
          error: 'Karyawan tidak ditemukan'
        },
        { status: 404 }
      )
    }

    // Cek duplikasi NIK jika NIK diupdate
    if (updateData.nik && updateData.nik !== existingEmployee.nik) {
      const existingNik = await prisma.employee.findFirst({
        where: {
          nik: updateData.nik,
          id: { not: id }
        }
      })

      if (existingNik) {
        logger.warn('Duplicate NIK attempted in update', { nik: updateData.nik, id })
        return NextResponse.json(
          {
            success: false,
            error: 'NIK sudah digunakan oleh karyawan lain'
          },
          { status: 409 }
        )
      }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData
    })

    logger.info('Employee updated successfully', { id, updatedFields: Object.keys(updateData) })

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Karyawan berhasil diupdate'
    })
  } catch (error) {
    logger.error('Error updating employee:', error)
    
    if (error instanceof z.ZodError) {
      logger.warn('Validation error in PUT /api/employees', { errors: error.errors })
      return NextResponse.json(
        {
          success: false,
          error: 'Data tidak valid',
          details: error.errors
        },
        { status: 400 }
      )
    }

    // Handle Prisma errors
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
       if (error.code === 'P2002') {
         logger.warn('Unique constraint violation in employee update', { error: error.message })
         return NextResponse.json(
           {
             success: false,
             error: 'Data sudah ada (duplikasi)'
           },
           { status: 409 }
         )
       }
 
       if (error.code === 'P2025') {
         logger.warn('Record not found in employee update', { error: error.message })
         return NextResponse.json(
           {
             success: false,
             error: 'Karyawan tidak ditemukan'
           },
           { status: 404 }
         )
       }
     }

    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengupdate karyawan'
      },
      { status: 500 }
    )
  }
}

// DELETE - Hapus karyawan (soft delete atau hard delete untuk testing)
export async function DELETE(request: NextRequest) {
  // prisma already initialized at top of file;
  if (!prisma) {
    logger.error('Database connection not available for DELETE /api/employees')
    return NextResponse.json(
      { success: false, error: 'Database connection not available' },
      { status: 500 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const hardDelete = searchParams.get('hardDelete') === 'true'
    const testingMode = searchParams.get('testingMode') === 'true'

    if (!id) {
      logger.warn('DELETE /api/employees called without ID')
      return NextResponse.json(
        {
          success: false,
          error: 'ID karyawan wajib diisi'
        },
        { status: 400 }
      )
    }

    // Validasi ID format (support UUID dan CUID)
    const isValidUUID = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    const isValidCUID = id.match(/^c[a-z0-9]{24}$/i)
    
    if (!isValidUUID && !isValidCUID) {
      logger.warn('Invalid ID format for employee deletion', { id })
      return NextResponse.json(
        {
          success: false,
          error: 'Format ID tidak valid'
        },
        { status: 400 }
      )
    }

    // Cek apakah employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: {
        payrollLines: true,
        employeeComponentSelections: true
      }
    })

    if (!existingEmployee) {
      logger.warn('Employee not found for deletion', { id })
      return NextResponse.json(
        {
          success: false,
          error: 'Karyawan tidak ditemukan'
        },
        { status: 404 }
      )
    }

    // HARD DELETE - Hanya untuk data testing dengan safety checks ketat
    if (hardDelete && testingMode) {
      logger.warn('Hard delete requested for employee', { id, employeeName: existingEmployee.nama })
      
      // Safety checks untuk hard delete
      const safetyChecks = {
        hasPayrollRecords: existingEmployee.payrollLines.length > 0,
        hasComponentSelections: existingEmployee.employeeComponentSelections.length > 0,
        isOldEmployee: existingEmployee.startDate && 
          new Date(existingEmployee.startDate) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 hari
        hasProductionData: existingEmployee.nama && !existingEmployee.nama.toLowerCase().includes('test')
      }

      // Blokir hard delete jika ada indikasi data produksi
      if (safetyChecks.hasPayrollRecords || safetyChecks.hasComponentSelections || 
          safetyChecks.isOldEmployee || safetyChecks.hasProductionData) {
        logger.error('Hard delete blocked - production data detected', { 
          id, 
          employeeName: existingEmployee.nama,
          safetyChecks 
        })
        return NextResponse.json(
          {
            success: false,
            error: 'Hard delete ditolak: Data karyawan memiliki relasi atau indikasi data produksi',
            details: {
              hasPayrollRecords: safetyChecks.hasPayrollRecords,
              hasComponentSelections: safetyChecks.hasComponentSelections,
              isOldEmployee: safetyChecks.isOldEmployee,
              hasProductionData: safetyChecks.hasProductionData
            }
          },
          { status: 403 }
        )
      }

      // Lakukan hard delete dengan transaction
      await prisma.$transaction(async (tx) => {
        // Hapus relasi terlebih dahulu jika ada
        await tx.payrollLine.deleteMany({
          where: { employeeId: id }
        })
        
        await tx.employeeComponentSelection.deleteMany({
          where: { employeeId: id }
        })
        
        // Hapus employee
        await tx.employee.delete({
          where: { id }
        })
      })

      logger.info('Employee hard deleted successfully', { id, employeeName: existingEmployee.nama })
      
      return NextResponse.json({
        success: true,
        message: 'Karyawan berhasil dihapus permanen (HARD DELETE)',
        data: { id, nama: existingEmployee.nama }
      })
    }

    // SOFT DELETE - Default behavior
    const employee = await prisma.employee.update({
      where: { id },
      data: { aktif: false }
    })

    logger.info('Employee soft deleted successfully', { id, employeeName: employee.nama })

    return NextResponse.json({
      success: true,
      message: 'Karyawan berhasil dinonaktifkan (soft delete)',
      data: employee
    })
  } catch (error) {
    logger.error('Error deleting employee:', error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          {
            success: false,
            error: 'Karyawan tidak ditemukan'
          },
          { status: 404 }
        )
      }
      
      if (error.code === 'P2003') {
        return NextResponse.json(
          {
            success: false,
            error: 'Tidak dapat menghapus karyawan karena masih memiliki data terkait'
          },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menghapus karyawan'
      },
      { status: 500 }
    )
  }
}
