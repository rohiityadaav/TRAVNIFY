const axios = require('axios');

async function runTests() {
  const serverUrl = 'http://localhost:5000';
  console.log(`=== RUNNING MULTI-CURRENCY INTEGRATION TESTS ===`);

  try {
    // 1. Test signup with country 'US'
    const email = `test_mc_${Math.random().toString(36).substring(2, 9)}@example.com`;
    console.log(`\n[1] Registering user ${email} with country 'US'...`);
    
    const signupRes = await axios.post(`${serverUrl}/api/auth/signup`, {
      name: 'MultiCurrency Tester',
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

    // 2. Call /api/auth/me to verify user profile returns currency fields
    console.log(`\n[2] Fetching user profile via /api/auth/me...`);
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

    // 4. Test payments order creation with Razorpay-supported currency (EUR)
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
      throw new Error(`EUR Order failed! Expected EUR and amount 219 (2.19 EUR), got ${orderEurRes.data.currency} and amount ${orderEurRes.data.amount}`);
    }
    console.log('✅ EUR order created successfully.');

    // 5. Test payments order creation with Razorpay-supported currency (INR)
    console.log(`\n[5] Creating payment order in INR...`);
    const orderInrRes = await axios.post(`${serverUrl}/api/payments/create-order`, {
      planId: 'premiumMonthly',
      currency: 'INR'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Payment order response (INR):');
    console.log(`   - OrderId : ${orderInrRes.data.orderId}`);
    console.log(`   - Amount  : ${orderInrRes.data.amount} (minor units)`);
    console.log(`   - Currency: ${orderInrRes.data.currency}`);

    if (orderInrRes.data.currency !== 'INR' || orderInrRes.data.amount !== 19900) {
      throw new Error(`INR Order failed! Expected INR and amount 19900 (199 INR), got ${orderInrRes.data.currency} and amount ${orderInrRes.data.amount}`);
    }
    console.log('✅ INR order created successfully.');

    // 6. Test fallback to INR for unsupported currency (e.g. AFN or CRC)
    console.log(`\n[6] Creating payment order in unsupported currency 'CRC'...`);
    const orderCrcRes = await axios.post(`${serverUrl}/api/payments/create-order`, {
      planId: 'premiumMonthly',
      currency: 'CRC'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Payment order response (CRC -> fallback):');
    console.log(`   - OrderId : ${orderCrcRes.data.orderId}`);
    console.log(`   - Amount  : ${orderCrcRes.data.amount} (minor units)`);
    console.log(`   - Currency: ${orderCrcRes.data.currency}`);

    if (orderCrcRes.data.currency !== 'INR' || orderCrcRes.data.amount !== 19900) {
      throw new Error(`Fallback failed! Expected fallback to INR (19900 paise), got ${orderCrcRes.data.currency} and amount ${orderCrcRes.data.amount}`);
    }
    console.log('✅ Fallback to INR worked correctly.');

    console.log(`\n🎉 === ALL TESTS COMPLETED SUCCESSFULLY ===`);

  } catch (error) {
    console.error(`\n❌ TEST FAILED:`);
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
