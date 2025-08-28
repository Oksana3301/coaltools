import { NextRequest, NextResponse } from 'next/server'
import { verifyMFAToken, verifyBackupCode } from '@/lib/mfa'
import { z } from 'zod'

const MFAVerifySchema = z.object({
  token: z.string().min(6, "Token MFA harus 6 digit"),
  userId: z.string(),
  isBackupCode: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = MFAVerifySchema.parse(body)

    // TODO: Get user's MFA secret from database
    // For now, return success for demo
    const isValid = validatedData.token.length === 6

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'MFA token valid'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Token MFA tidak valid' },
        { status: 400 }
      )
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Data tidak valid', 
          details: error.issues 
        },
        { status: 400 }
      )
    }

    console.error('Error verifying MFA:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal verifikasi MFA' },
      { status: 500 }
    )
  }
}
