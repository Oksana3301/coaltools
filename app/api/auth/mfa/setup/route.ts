import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { generateMFASecret } from '@/lib/mfa'
import { PrismaClient } from '@prisma/client'

// Singleton pattern untuk Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }

    // prisma already initialized above

    // Generate MFA secret
    const mfaSetup = await generateMFASecret(user.email)

    // TODO: Store the secret in database (encrypted)
    // For now, return the setup data
    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl: mfaSetup.qrCodeUrl,
        manualEntryKey: mfaSetup.manualEntryKey,
        backupCodes: mfaSetup.backupCodes
      }
    })

  } catch (error) {
    console.error('Error setting up MFA:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal setup MFA' },
      { status: 500 }
    )
  }
}
