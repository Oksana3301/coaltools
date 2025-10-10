import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Simple login test API called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    // Simple validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }
    
    // Simple hardcoded check
    if (body.email === 'admin@coaltools.com' && body.password === 'admin123') {
      return NextResponse.json({
        success: true,
        data: {
          id: 'admin-test',
          email: 'admin@coaltools.com',
          role: 'ADMIN'
        },
        message: 'Login berhasil (simple test)'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Email atau password salah' },
      { status: 401 }
    );
    
  } catch (error) {
    console.error('Simple login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat login (simple test)' },
      { status: 500 }
    );
  }
}