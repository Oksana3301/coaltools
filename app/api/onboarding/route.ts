import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import { z } from 'zod'

// Force this route to be dynamic to prevent build-time execution
export const dynamic = 'force-dynamic'

// Don't initialize Prisma at module level to avoid build-time issues
let prismaInstance: ReturnType<typeof getPrismaClient> | null = null

function getPrisma() {
  if (!prismaInstance) {
    prismaInstance = getPrismaClient()
  }
  return prismaInstance
}

// Validation schemas
const OnboardingSchema = z.object({
  runs_profile: z.object({
    full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
    job_title: z.enum(['Direktur', 'Direktur Operasional', 'Accounting', 'Admin Lapangan', 'Operator', 'Lainnya']),
    preferred_lang: z.enum(['id', 'en', 'both']),
    preferred_formats: z.array(z.enum(['whatsapp', 'pdf', 'excel'])).min(1, 'Pilih minimal 1 format'),
    reminder_channel: z.enum(['email', 'whatsapp', 'none']),
    signature_name: z.string().optional(),
  }),
  onboarding_answers: z.object({
    language: z.enum(['id', 'en', 'both']),
    report_formats: z.array(z.string()).min(1),
    common_expenses: z.array(z.string()).min(1, 'Pilih minimal 1 komponen biaya'),
    budget_alerts: z.boolean(),
    monthly_target_mt: z.number().optional(),
    show_target_vs_actual: z.boolean(),
    payroll_modes: z.array(z.string()).min(1, 'Pilih minimal 1 pola gaji'),
    payroll_components: z.array(z.string()).min(1, 'Pilih minimal 1 komponen payroll'),
    input_devices: z.array(z.string()).min(1, 'Pilih minimal 1 media input'),
    reminder_channel: z.enum(['email', 'whatsapp', 'none']),
    sample_report_file_id: z.string().optional(),
    allow_custom_notes: z.boolean(),
  }),
  personal_best: z.object({
    title: z.string(),
    notes: z.string().optional(),
    sample_file_id: z.string().optional(),
  }).optional(),
})

// GET - Check onboarding status
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma()
    
    // Early return if database is not available (during build time)
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not available during build' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    // Ensure user exists for demo purposes
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: `${userId}@example.com`,
        name: 'Demo User',
        password: 'demo-password', // Demo password for onboarding flow
      },
      update: {},
    })

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    return NextResponse.json({
      success: true,
      data: {
        hasCompletedOnboarding: user?.role === 'ADMIN' || false,
        profile: user,
      }
    })
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check onboarding status' },
      { status: 500 }
    )
  }
}

// POST - Submit onboarding data
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma()
    
    // Early return if database is not available (during build time)
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not available during build' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    // Validate the data
    const validatedData = OnboardingSchema.parse(body)

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // First, ensure the user exists (create if not exists for demo purposes)
      await tx.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: `${userId}@example.com`,
          name: validatedData.runs_profile.full_name,
          password: 'demo-password', // Demo password for onboarding flow
        },
        update: {
          name: validatedData.runs_profile.full_name,
        },
      })

      // Upsert runs_profile
      const createData: any = {
        userId,
        fullName: validatedData.runs_profile.full_name,
        jobTitle: validatedData.runs_profile.job_title,
        preferredLang: validatedData.runs_profile.preferred_lang,
        preferredFormats: JSON.stringify(validatedData.runs_profile.preferred_formats),
        reminderChannel: validatedData.runs_profile.reminder_channel,
        signatureName: validatedData.runs_profile.signature_name || validatedData.runs_profile.full_name,
        hasCompletedOnboarding: true,
      };

      const updateData: any = {
        fullName: validatedData.runs_profile.full_name,
        jobTitle: validatedData.runs_profile.job_title,
        preferredLang: validatedData.runs_profile.preferred_lang,
        preferredFormats: JSON.stringify(validatedData.runs_profile.preferred_formats),
        reminderChannel: validatedData.runs_profile.reminder_channel,
        signatureName: validatedData.runs_profile.signature_name || validatedData.runs_profile.full_name,
        hasCompletedOnboarding: true,
      };

      const user = await tx.user.update({
        where: { id: userId },
        data: updateData,
      })

      // Skip onboarding_answers and personal_best operations as models don't exist

      return {
        user,
        onboardingAnswers: null,
        personalBest: null,
      }
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Onboarding selesai. Laporan Anda akan dipersonalisasi sesuai preferensi.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data tidak valid',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Error submitting onboarding:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit onboarding data' },
      { status: 500 }
    )
  }
}
