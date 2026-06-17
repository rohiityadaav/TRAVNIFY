const axios = require('axios');

async function testDiscover() {
  const serverUrl = 'http://localhost:5000';
  console.log(`Testing discover API against ${serverUrl}...`);
  
  try {
    // 1. Signup a new user
    const email = `test_${Math.random().toString(36).substring(2, 9)}@example.com`;
    console.log(`Signing up user: ${email}...`);
    const signupRes = await axios.post(`${serverUrl}/api/auth/signup`, {
      name: 'Test Explorer',
      email: email,
      password: 'password123',
      country: 'US'
    });
    
    const token = signupRes.data.token;
    console.log(`Signup success! Token obtained.`);
    
    // 2. Call best-for-activity
    console.log(`Calling /api/discover/best-for-activity...`);
    const activityRes = await axios.post(`${serverUrl}/api/discover/best-for-activity`, 
      { query: 'Scuba diving' },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    console.log(`Activity Explorer Response (Status: ${activityRes.status}):`);
    console.log(JSON.stringify(activityRes.data, null, 2));
    
  } catch (err) {
    console.error(`Error details:`);
    if (err.response) {
      console.error(`Status:`, err.response.status);
      console.error(`Data:`, JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

testDiscover();
