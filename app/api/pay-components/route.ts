import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Conditional imports based on environment
let db: any = null
let prisma: any = null

if (process.env.NODE_ENV === 'production') {
  // Use Supabase for production
  const { supabaseQuery } = require('@/lib/db')
  prisma = { supabaseQuery }
} else {
  // Use SQLite for development
  const Database = require('better-sqlite3')
  const { randomBytes } = require('crypto')
  db = new Database('./dev.db')
}

// Helper function to generate ID
function generateId() {
  const { randomBytes } = require('crypto')
  return randomBytes(12).toString('hex')
}

// Validation schema
const payComponentSchema = z.object({
  nama: z.string().min(1, "Nama komponen harus diisi"),
  tipe: z.enum(['EARNING', 'DEDUCTION'], {
    errorMap: () => ({ message: "Tipe harus EARNING atau DEDUCTION" })
  }),
  metode: z.enum(['FLAT', 'PERCENTAGE'], {
    errorMap: () => ({ message: "Metode harus FLAT atau PERCENTAGE" })
  }),
  basis: z.enum(['BRUTO', 'NETTO'], {
    errorMap: () => ({ message: "Basis harus BRUTO atau NETTO" })
  }),
  rate: z.number().min(0).max(100).optional(),
  nominal: z.number().min(0).optional(),
  aktif: z.boolean().default(true)
}).refine((data) => {
  if (data.metode === 'PERCENTAGE' && (data.rate === undefined || data.rate === null)) {
    return false
  }
  if (data.metode === 'FLAT' && (data.nominal === undefined || data.nominal === null)) {
    return false
  }
  return true
}, {
  message: "Rate diperlukan untuk metode PERCENTAGE, Nominal diperlukan untuk metode FLAT"
})

// GET - Ambil semua komponen gaji
export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Production: Use Supabase
      const { supabaseQuery } = await import('@/lib/db')
      const result = await supabaseQuery('pay_components', 'select')
      
      return NextResponse.json({
        success: true,
        data: result || []
      })
    } else {
      // Development: Use SQLite
      const stmt = db.prepare('SELECT * FROM pay_components ORDER BY createdAt DESC')
      const components = stmt.all()

      return NextResponse.json({
        success: true,
        data: components
      })
    }
  } catch (error) {
    console.error('Error fetching pay components:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal mengambil data komponen gaji'
    }, { status: 500 })
  }
}

// POST - Tambah komponen gaji baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = payComponentSchema.parse(body)

    if (process.env.NODE_ENV === 'production') {
      // Production: Use Supabase
      const { supabaseQuery } = await import('@/lib/db')
      const componentData = {
        nama: validatedData.nama,
        tipe: validatedData.tipe,
        metode: validatedData.metode,
        basis: validatedData.basis,
        rate: validatedData.rate || null,
        nominal: validatedData.nominal || null,
        aktif: validatedData.aktif
      }

      const result = await supabaseQuery('pay_components', 'insert', componentData)

      return NextResponse.json({
        success: true,
        data: result?.[0] || componentData,
        message: 'Komponen gaji berhasil ditambahkan'
      })
    } else {
      // Development: Use SQLite
      const id = generateId()
      const now = new Date().toISOString()

      const stmt = db.prepare(`
        INSERT INTO pay_components (id, nama, tipe, metode, basis, rate, nominal, aktif, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const result = stmt.run(
        id,
        validatedData.nama,
        validatedData.tipe,
        validatedData.metode,
        validatedData.basis,
        validatedData.rate || null,
        validatedData.nominal || null,
        validatedData.aktif ? 1 : 0,
        now,
        now
      )

      // Get the created component
      const getStmt = db.prepare('SELECT * FROM pay_components WHERE id = ?')
      const newComponent = getStmt.get(id)

      return NextResponse.json({
        success: true,
        data: newComponent,
        message: 'Komponen gaji berhasil ditambahkan'
      })
    }
  } catch (error) {
    console.error('Error creating pay component:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data tidak valid',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Gagal menambahkan komponen gaji'
    }, { status: 500 })
  }
}

// PUT - Update komponen gaji
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID komponen harus disertakan'
      }, { status: 400 })
    }

    const validatedData = payComponentSchema.parse(updateData)

    if (process.env.NODE_ENV === 'production') {
      // Production: Use Supabase
      const { supabaseQuery } = await import('@/lib/db')
      const componentData = {
        nama: validatedData.nama,
        tipe: validatedData.tipe,
        metode: validatedData.metode,
        basis: validatedData.basis,
        rate: validatedData.rate || null,
        nominal: validatedData.nominal || null,
        aktif: validatedData.aktif,
        updated_at: new Date().toISOString()
      }

      const result = await supabaseQuery('pay_components', 'update', { id, ...componentData })

      if (!result || result.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Komponen gaji tidak ditemukan'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: result[0],
        message: 'Komponen gaji berhasil diupdate'
      })
    } else {
      // Development: Use SQLite
      const now = new Date().toISOString()

      const stmt = db.prepare(`
        UPDATE pay_components 
        SET nama = ?, tipe = ?, metode = ?, basis = ?, rate = ?, nominal = ?, aktif = ?, updatedAt = ?
        WHERE id = ?
      `)

      const result = stmt.run(
        validatedData.nama,
        validatedData.tipe,
        validatedData.metode,
        validatedData.basis,
        validatedData.rate || null,
        validatedData.nominal || null,
        validatedData.aktif ? 1 : 0,
        now,
        id
      )

      if (result.changes === 0) {
        return NextResponse.json({
          success: false,
          error: 'Komponen gaji tidak ditemukan'
        }, { status: 404 })
      }

      // Get the updated component
      const getStmt = db.prepare('SELECT * FROM pay_components WHERE id = ?')
      const updatedComponent = getStmt.get(id)

      return NextResponse.json({
        success: true,
        data: updatedComponent,
        message: 'Komponen gaji berhasil diupdate'
      })
    }
  } catch (error) {
    console.error('Error updating pay component:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Data tidak valid',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Gagal mengupdate komponen gaji'
    }, { status: 500 })
  }
}

// DELETE - Hapus komponen gaji
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID komponen harus disertakan'
      }, { status: 400 })
    }

    if (process.env.NODE_ENV === 'production') {
      // Production: Use Supabase
      const { supabaseQuery } = await import('@/lib/db')
      const result = await supabaseQuery('pay_components', 'delete', { id })

      return NextResponse.json({
        success: true,
        message: 'Komponen gaji berhasil dihapus'
      })
    } else {
      // Development: Use SQLite
      const stmt = db.prepare('DELETE FROM pay_components WHERE id = ?')
      const result = stmt.run(id)

      if (result.changes === 0) {
        return NextResponse.json({
          success: false,
          error: 'Komponen gaji tidak ditemukan'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        message: 'Komponen gaji berhasil dihapus'
      })
    }
  } catch (error) {
    console.error('Error deleting pay component:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal menghapus komponen gaji'
    }, { status: 500 })
  }
}
