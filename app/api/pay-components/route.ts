import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { z } from 'zod'

// Schema untuk validasi input pay component
const payComponentSchema = z.object({
  nama: z.string().min(1, 'Nama komponen wajib diisi'),
  tipe: z.enum(['EARNING', 'DEDUCTION'], { 
    errorMap: () => ({ message: 'Tipe harus EARNING atau DEDUCTION' })
  }),
  taxable: z.boolean().default(false),
  metode: z.enum(['FLAT', 'PER_HARI', 'PERSENTASE'], {
    errorMap: () => ({ message: 'Metode harus FLAT, PER_HARI, atau PERSENTASE' })
  }),
  basis: z.enum(['UPAH_HARIAN', 'BRUTO', 'HARI_KERJA'], {
    errorMap: () => ({ message: 'Basis harus UPAH_HARIAN, BRUTO, atau HARI_KERJA' })
  }),
  rate: z.number().min(0).optional(),
  nominal: z.number().min(0).optional(),
  capMin: z.number().min(0).optional(),
  capMax: z.number().min(0).optional(),
  order: z.number().default(0),
  aktif: z.boolean().default(true)
})

// GET - Ambil semua komponen gaji
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
    const tipe = searchParams.get('tipe')
    const aktif = searchParams.get('aktif')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    const payComponents = await prisma.$queryRaw`
      SELECT 
        id, nama, tipe, taxable, metode, basis, rate, nominal, 
        cap_min as "capMin", cap_max as "capMax", "order", aktif,
        created_by, created_at, updated_at
      FROM pay_components 
      WHERE aktif = true
      ORDER BY "order" ASC, nama ASC
    ` as any[]

    return NextResponse.json({
      success: true,
      data: payComponents
    })
  } catch (error) {
    console.error('Error fetching pay components:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data komponen gaji'
      },
      { status: 500 }
    )
  }
}

// POST - Tambah komponen gaji baru
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
    const validatedData = payComponentSchema.parse(body)

    // Validasi rate/nominal berdasarkan metode
    if (validatedData.metode === 'FLAT' && !validatedData.nominal) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nominal wajib diisi untuk metode FLAT'
        },
        { status: 400 }
      )
    }

    if (['PER_HARI', 'PERSENTASE'].includes(validatedData.metode) && !validatedData.rate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate wajib diisi untuk metode PER_HARI atau PERSENTASE'
        },
        { status: 400 }
      )
    }

    const payComponent = await prisma.payComponent.create({
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: payComponent,
      message: 'Komponen gaji berhasil ditambahkan'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating pay component:', error)
    
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
        error: 'Gagal menambahkan komponen gaji'
      },
      { status: 500 }
    )
  }
}

// PUT - Update komponen gaji
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
          error: 'ID komponen gaji wajib diisi'
        },
        { status: 400 }
      )
    }

    const validatedData = payComponentSchema.partial().parse(updateData)

    const payComponent = await prisma.payComponent.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: payComponent,
      message: 'Komponen gaji berhasil diupdate'
    })
  } catch (error) {
    console.error('Error updating pay component:', error)
    
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
        error: 'Gagal mengupdate komponen gaji'
      },
      { status: 500 }
    )
  }
}

// DELETE - Hapus komponen gaji (soft delete by default, hard delete dengan force=true)
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
    const force = searchParams.get('force') === 'true'

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID komponen gaji wajib diisi'
        },
        { status: 400 }
      )
    }

    // Check if component exists
    const payComponent = await prisma.payComponent.findUnique({
      where: { id },
      select: { 
        id: true, 
        nama: true, 
        aktif: true,
        payrollLineComponents: {
          select: { id: true }
        }
      }
    })

    if (!payComponent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Komponen gaji tidak ditemukan'
        },
        { status: 404 }
      )
    }

    // If already inactive and user wants soft delete, don't allow
    if (!payComponent.aktif && !force) {
      return NextResponse.json(
        {
          success: false,
          error: 'Komponen sudah dinonaktifkan. Gunakan force=true untuk penghapusan permanen.'
        },
        { status: 400 }
      )
    }

    // For hard delete, check if component is used in any payroll
    if (force && payComponent.payrollLineComponents.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Komponen gaji tidak bisa dihapus permanen karena sudah digunakan dalam payroll. Gunakan soft delete saja.'
        },
        { status: 400 }
      )
    }

    if (force) {
      // Hard delete - permanently remove from database
      await prisma.payComponent.delete({
        where: { id }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Komponen gaji berhasil dihapus permanen'
      })
    } else {
      // Soft delete - mark as inactive
      const updatedComponent = await prisma.payComponent.update({
        where: { id },
        data: { aktif: false }
      })

      return NextResponse.json({
        success: true,
        data: updatedComponent,
        message: 'Komponen gaji berhasil dinonaktifkan'
      })
    }
  } catch (error) {
    console.error('Error deleting pay component:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal menghapus komponen gaji'
      },
      { status: 500 }
    )
  }
}
