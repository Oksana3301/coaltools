import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { generateMFASecret } from '@/lib/mfa'
import { prisma } from '@/lib/db'


// Use shared prisma client from lib/db


export async function POST(request: NextRequest) {
  try {
  // Check if prisma client is available
  if (!prisma) {
  return NextResponse.json(
  { success: false, error: 'Database connection not available' },
  { status: 503 }
  )
  }

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
