const axios = require('axios');

async function runLiveUserSimulation() {
  const renderBase = 'https://travnify.onrender.com';
  console.log(`=== SIMULATING PRODUCTION USER JOURNEY ===\n`);

  try {
    // 1. Sign up a new user with Country: US
    const email = `us_user_${Math.random().toString(36).substring(2, 9)}@example.com`;
    console.log(`[1] Simulating signup for US resident: ${email}...`);
    
    const signupRes = await axios.post(`${renderBase}/api/auth/signup`, {
      name: 'John Doe',
      email: email,
      password: 'password123',
      country: 'US'
    });

    const token = signupRes.data.token;
    const user = signupRes.data.user;

    console.log('    ✅ Signup succeeded!');
    console.log(`    - Returned Country          : "${user.country}"`);
    console.log(`    - Returned PreferredCurrency: "${user.preferredCurrency}"`);

    // 2. Fetch /api/auth/me to confirm it returns preferredCurrency
    console.log('\n[2] Calling /api/auth/me...');
    const meRes = await axios.get(`${renderBase}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('    ✅ Profile fetched successfully!');
    console.log(`    - Country          : "${meRes.data.country}"`);
    console.log(`    - PreferredCurrency: "${meRes.data.preferredCurrency}"`);

    // 3. Generate a trip to check the costs are in USD
    console.log('\n[3] Generating trip to Hawaii (USD budget: 2000)...');
    const tripPayload = {
      prompt: 'Hawaii beach trip',
      destination: 'Hawaii',
      budget: 2000,
      currency: 'USD',
      startDate: '2026-08-01',
      endDate: '2026-08-04',
      interests: ['beach', 'relaxing'],
      preferredCurrency: meRes.data.preferredCurrency // 'USD'
    };

    const tripRes = await axios.post(`${renderBase}/api/generateTrip`, tripPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('    ✅ Trip generated successfully!');
    const itinerary = tripRes.data.itinerary;
    console.log(`    - Destination: "${itinerary.destination}"`);
    console.log(`    - AI Estimated Total Cost: ${itinerary.estimatedTotalCost.value} ${itinerary.estimatedTotalCost.currency}`);
    
    // Check first day block cost currency
    const firstDay = itinerary.days[0];
    const firstBlock = firstDay.blocks[0];
    console.log(`    - Sample Activity: "${firstBlock.title}"`);
    console.log(`      Approx Cost    : ${firstBlock.approxCost.value} ${firstBlock.approxCost.currency}`);

    // 4. Inspect the Razorpay order creation request
    console.log('\n[4] Starting Premium pricing checkout flow (creating Razorpay order)...');
    const orderPayload = {
      planId: 'premiumMonthly',
      currency: meRes.data.preferredCurrency // 'USD'
    };

    const orderRes = await axios.post(`${renderBase}/api/payments/create-order`, orderPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('    ✅ Payment order created successfully!');
    console.log('    - Response fields:');
    console.log(`      * orderId : "${orderRes.data.orderId}"`);
    console.log(`      * currency: "${orderRes.data.currency}"`);
    console.log(`      * amount  : ${orderRes.data.amount} (minor units / cents)`);

    console.log('\n=== SIMULATION COMPLETE ===');

  } catch (err) {
    console.error('❌ SIMULATION FAILED:');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error('Body:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

runLiveUserSimulation();
