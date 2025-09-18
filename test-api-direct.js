const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Simulate the exact API logic
async function testApiDirect() {
  console.log('🔍 Testing API login logic directly...');
  
  const prisma = new PrismaClient();
  
  try {
    // Simulate the exact request body
    const requestBody = {
      email: 'admin@coaltools.com',
      password: 'admin123'
    };
    
    console.log('\n1. Request body:', requestBody);
    
    // Validate data (simulate zod validation)
    console.log('\n2. Validating request data...');
    if (!requestBody.email || !requestBody.password) {
      console.log('❌ Validation failed: Missing email or password');
      return;
    }
    
    if (!requestBody.email.includes('@')) {
      console.log('❌ Validation failed: Invalid email format');
      return;
    }
    
    console.log('✅ Request validation passed');
    
    // Test database connection
    console.log('\n3. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Find user by email (exact API logic)
    console.log('\n4. Finding user by email...');
    const user = await prisma.user.findUnique({
      where: { email: requestBody.email }
    });
    
    if (!user) {
      console.log('❌ User not found - API would return 401');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      aktif: user.aktif
    });
    
    // Verify password (exact API logic)
    console.log('\n5. Verifying password...');
    const isPasswordValid = await bcrypt.compare(requestBody.password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Password invalid - API would return 401');
      return;
    }
    
    console.log('✅ Password valid');
    
    // Create response (exact API logic)
    console.log('\n6. Creating API response...');
    const { password, ...userWithoutPassword } = user;
    
    const apiResponse = {
      success: true,
      data: userWithoutPassword,
      message: 'Login berhasil'
    };
    
    console.log('✅ API response created successfully!');
    console.log('Response:', JSON.stringify(apiResponse, null, 2));
    
    // Test actual HTTP call with detailed error handling
    console.log('\n7. Testing actual HTTP API call...');
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('HTTP Status:', response.status);
      console.log('HTTP Status Text:', response.statusText);
      console.log('HTTP Headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Raw Response:', responseText);
      
      try {
        const responseJson = JSON.parse(responseText);
        console.log('Parsed Response:', responseJson);
        
        if (responseJson.success) {
          console.log('🎉 API call successful!');
        } else {
          console.log('❌ API call failed:', responseJson.error);
        }
      } catch (parseError) {
        console.log('❌ Failed to parse response as JSON:', parseError.message);
      }
      
    } catch (fetchError) {
      console.log('❌ HTTP request failed:', fetchError.message);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testApiDirect();