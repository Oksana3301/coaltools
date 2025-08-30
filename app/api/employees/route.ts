import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { z } from 'zod'

// Schema untuk validasi input employee
const employeeSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  nik: z.string().optional(),
  jabatan: z.string().min(1, 'Jabatan wajib diisi'),
  site: z.string().min(1, 'Site wajib diisi'),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
  alamat: z.string().optional(),
  kontrakUpahHarian: z.number().min(0, 'Upah harian harus positif'),
  defaultUangMakan: z.number().min(0, 'Uang makan harus positif'),
  defaultUangBbm: z.number().min(0, 'Uang BBM harus positif'),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  npwp: z.string().optional(),
  startDate: z.string().optional(),
  aktif: z.boolean().default(true)
})

// GET - Ambil semua karyawan
export async function GET(request: NextRequest) {
    const prisma = getPrismaClient();
    if (!prisma) {
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
    console.error('Error fetching employees:', error)
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
    const prisma = getPrismaClient();
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    
  try {
    const body = await request.json()
    const validatedData = employeeSchema.parse(body)

    const employee = await prisma.employee.create({
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Karyawan berhasil ditambahkan'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data tidak valid',
          details: error.errors
        },
        { status: 400 }
      )
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
    const prisma = getPrismaClient();
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID karyawan wajib diisi'
        },
        { status: 400 }
      )
    }

    const validatedData = employeeSchema.partial().parse(updateData)

    const employee = await prisma.employee.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Karyawan berhasil diupdate'
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data tidak valid',
          details: error.errors
        },
        { status: 400 }
      )
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

// DELETE - Hapus karyawan (soft delete dengan aktif = false)
export async function DELETE(request: NextRequest) {
    const prisma = getPrismaClient();
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID karyawan wajib diisi'
        },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: { aktif: false }
    })

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Karyawan berhasil dinonaktifkan'
    })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menghapus karyawan'
      },
      { status: 500 }
    )
  }
}
