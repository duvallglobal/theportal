import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('Testing admin login...');
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
    
    if (adminLoginResponse.ok) {
      const adminData = await adminLoginResponse.json();
      console.log('Admin login successful:', adminData);
    } else {
      console.error('Admin login failed:', await adminLoginResponse.text());
    }
    
    console.log('\nTesting client login...');
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
    
    if (clientLoginResponse.ok) {
      const clientData = await clientLoginResponse.json();
      console.log('Client login successful:', clientData);
    } else {
      console.error('Client login failed:', await clientLoginResponse.text());
    }
    
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin();