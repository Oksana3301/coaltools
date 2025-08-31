import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 payroll-simple POST endpoint hit')
    
    // Step 1: Test basic response
    const testResponse = {
      success: true,
      message: 'Payroll simple endpoint working',
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Basic response test passed')
    
    // Step 2: Test request parsing  
    let body
    try {
      body = await request.json()
      console.log('✅ Request body parsed successfully')
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError)
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      }, { status: 400 })
    }
    
    // Step 3: Test environment variables
    const envTest = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL
    }
    console.log('🌍 Environment test:', envTest)
    
    // Step 4: Return success with received data
    return NextResponse.json({
      success: true,
      message: 'Payroll simple endpoint working completely',
      receivedData: body,
      environment: envTest,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🔥 payroll-simple ERROR:', error)
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({
      success: false,
      error: 'Payroll simple endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
