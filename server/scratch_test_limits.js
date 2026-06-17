const db = require('./db');
const fs = require('fs');
const path = require('path');

async function testCredits() {
  console.log('--- STARTING LIMITS TEST ---');
  
  // 1. Create a mock free user
  const email = `test_free_user_${Date.now()}@test.com`;
  const mockUser = {
    id: `usr_test_${Math.random().toString(36).substring(2, 11)}`,
    name: 'Test Free User',
    email: email,
    passwordHash: 'test_hash',
    country: 'IN',
    currency: 'INR',
    isPremium: false,
    subscriptionType: null,
    subscriptionStart: null,
    subscriptionEnd: null,
    freeTripsGenerated: 0,
    dailyCreditsUsed: 0,
    creditsWindowStartedAt: null,
    emailVerified: true
  };
  
  db.users.create(mockUser);
  console.log(`Created mock free user: ${mockUser.email} (ID: ${mockUser.id})`);
  
  // 2. Consume 1 credit
  console.log('Consuming first credit...');
  let res1 = db.users.consumeCredit(mockUser.id);
  console.log('Result 1:', res1);
  
  // 3. Consume second credit
  console.log('Consuming second credit...');
  let res2 = db.users.consumeCredit(mockUser.id);
  console.log('Result 2:', res2);
  
  // 4. Verify in db.json
  const dbFile = path.join(__dirname, 'data', 'db.json');
  const dbContent = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  const savedUser = dbContent.users.find(u => u.id === mockUser.id);
  
  console.log('Saved user in db.json:');
  console.log('- dailyCreditsUsed:', savedUser.dailyCreditsUsed);
  console.log('- creditsWindowStartedAt:', savedUser.creditsWindowStartedAt);
  
  if (savedUser.dailyCreditsUsed === 2 && savedUser.creditsWindowStartedAt) {
    console.log('✅ SUCCESS: Credits successfully persisted to db.json');
  } else {
    console.log('❌ FAILURE: Credits did not persist as expected.');
    process.exit(1);
  }
  
  // Clean up
  dbContent.users = dbContent.users.filter(u => u.id !== mockUser.id);
  fs.writeFileSync(dbFile, JSON.stringify(dbContent, null, 2), 'utf8');
  console.log('Cleaned up mock user from db.json');
  console.log('--- TEST COMPLETED SUCCESSFULLY ---');
}

testCredits().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
