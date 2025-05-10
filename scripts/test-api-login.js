import fetch from 'node-fetch';

async function testLogin() {
  console.log('Testing login with admin credentials...');

  try {
    // Test admin login
    const adminLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'secret',
      }),
    });

    const adminResult = await adminLoginResponse.json();
    console.log(`Admin login status: ${adminLoginResponse.status}`);
    console.log('Admin login response:', adminResult);

    // Test client login
    console.log('\nTesting login with client credentials...');
    const clientLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'client@example.com',
        password: 'password123',
      }),
    });

    const clientResult = await clientLoginResponse.json();
    console.log(`Client login status: ${clientLoginResponse.status}`);
    console.log('Client login response:', clientResult);

  } catch (error) {
    console.error('Error during login test:', error);
  }
}

testLogin();