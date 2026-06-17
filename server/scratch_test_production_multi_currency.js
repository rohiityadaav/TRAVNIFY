const axios = require('axios');

async function runTests() {
  const serverUrl = 'https://travnify.onrender.com';
  console.log(`=== RUNNING MULTI-CURRENCY PRODUCTION TESTS ===`);

  try {
    // 1. Test signup with country 'US'
    const email = `test_prod_mc_${Math.random().toString(36).substring(2, 9)}@example.com`;
    console.log(`\n[1] Registering user ${email} with country 'US' on Render...`);
    
    const signupRes = await axios.post(`${serverUrl}/api/auth/signup`, {
      name: 'Prod Tester',
      email: email,
      password: 'password123',
      country: 'US'
    });

    const token = signupRes.data.token;
    const userObj = signupRes.data.user;

    console.log('✅ Signup response received.');
    console.log(`   - Country          : ${userObj.country}`);
    console.log(`   - PreferredCurrency: ${userObj.preferredCurrency}`);

    if (userObj.country !== 'US' || userObj.preferredCurrency !== 'USD') {
      throw new Error(`Country/PreferredCurrency mismatch! Expected US/USD, got ${userObj.country}/${userObj.preferredCurrency}`);
    }
    console.log('✅ Country and preferred currency auto-set successfully.');

    // 2. Fetch profile via /api/auth/me
    console.log(`\n[2] Fetching profile via /api/auth/me...`);
    const meRes = await axios.get(`${serverUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Profile response received.');
    console.log(`   - Country          : ${meRes.data.country}`);
    console.log(`   - PreferredCurrency: ${meRes.data.preferredCurrency}`);

    if (meRes.data.preferredCurrency !== 'USD') {
      throw new Error(`Profile did not return correct preferredCurrency!`);
    }
    console.log('✅ Profile verification successful.');

    // 3. Update preferred currency via PATCH /api/auth/profile
    console.log(`\n[3] Updating preferredCurrency to 'EUR' via PATCH /api/auth/profile...`);
    const updateRes = await axios.patch(`${serverUrl}/api/auth/profile`, {
      preferredCurrency: 'EUR'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Update response received.');
    console.log(`   - New PreferredCurrency: ${updateRes.data.preferredCurrency}`);

    if (updateRes.data.preferredCurrency !== 'EUR') {
      throw new Error(`Profile update failed! Expected EUR, got ${updateRes.data.preferredCurrency}`);
    }
    console.log('✅ Profile update successful.');

    // 4. Test order creation in EUR
    console.log(`\n[4] Creating payment order in EUR...`);
    const orderEurRes = await axios.post(`${serverUrl}/api/payments/create-order`, {
      planId: 'premiumMonthly',
      currency: 'EUR'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Payment order response (EUR):');
    console.log(`   - OrderId : ${orderEurRes.data.orderId}`);
    console.log(`   - Amount  : ${orderEurRes.data.amount} (minor units)`);
    console.log(`   - Currency: ${orderEurRes.data.currency}`);

    if (orderEurRes.data.currency !== 'EUR' || orderEurRes.data.amount !== 219) {
      throw new Error(`EUR Order failed! Expected EUR/219, got ${orderEurRes.data.currency}/${orderEurRes.data.amount}`);
    }
    console.log('✅ EUR order created successfully.');

    console.log(`\n🎉 === ALL PRODUCTION TESTS COMPLETED SUCCESSFULLY ===`);

  } catch (error) {
    console.error(`\n❌ PRODUCTION TEST FAILED:`);
    if (error.response) {
      console.error(`Status:`, error.response.status);
      console.error(`Data  :`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runTests();
