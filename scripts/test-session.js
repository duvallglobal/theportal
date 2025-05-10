import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import { promisify } from 'util';
import fetchCookie from 'fetch-cookie';

async function testSessionManagement() {
  console.log('Testing full authentication flow with session management...');

  try {
    // Create cookie jar to store and send cookies between requests
    const jar = new CookieJar();
    const fetchWithCookies = fetchCookie(fetch, jar);
    
    // Step 1: Login
    console.log('\nStep 1: Logging in as admin...');
    const loginResponse = await fetchWithCookies('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'secret',
      }),
    });

    const loginResult = await loginResponse.json();
    console.log(`Login status: ${loginResponse.status}`);
    if (loginResponse.status !== 200) {
      console.log('Login failed:', loginResult);
      return;
    }
    
    console.log('Login successful - User details:');
    console.log({
      id: loginResult.id,
      username: loginResult.username,
      email: loginResult.email,
      role: loginResult.role,
    });
    
    // Step 2: Get current user info with session
    console.log('\nStep 2: Getting current user info with session cookie...');
    const meResponse = await fetchWithCookies('http://localhost:5000/api/auth/me', {
      method: 'GET',
    });
    
    const meResult = await meResponse.json();
    console.log(`Get current user status: ${meResponse.status}`);
    if (meResponse.status !== 200) {
      console.log('Get current user failed:', meResult);
      return;
    }
    
    console.log('Get current user successful:');
    console.log({
      id: meResult.id,
      username: meResult.username,
      email: meResult.email,
      role: meResult.role,
    });
    
    // Step 3: Logout
    console.log('\nStep 3: Logging out...');
    const logoutResponse = await fetchWithCookies('http://localhost:5000/api/auth/logout', {
      method: 'POST',
    });
    
    const logoutResult = await logoutResponse.json();
    console.log(`Logout status: ${logoutResponse.status}`);
    console.log('Logout response:', logoutResult);
    
    // Step 4: Try to get user info after logout
    console.log('\nStep 4: Trying to get user info after logout (should fail)...');
    const afterLogoutResponse = await fetchWithCookies('http://localhost:5000/api/auth/me', {
      method: 'GET',
    });
    
    const afterLogoutResult = await afterLogoutResponse.json();
    console.log(`Get user after logout status: ${afterLogoutResponse.status}`);
    console.log('Get user after logout response:', afterLogoutResult);
    
    if (afterLogoutResponse.status === 401) {
      console.log('\n✅ Authentication flow test completed successfully!');
    } else {
      console.log('\n❌ Authentication flow test failed! Session management may have issues.');
    }
    
  } catch (error) {
    console.error('Error during session management test:', error);
  }
}

testSessionManagement();