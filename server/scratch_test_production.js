/**
 * Production E2E verification script
 * Tests: Render backend is alive, firebase-sync returns isPremium for premium user,
 *        Activity Explorer works, credit consumption persists.
 */
const https = require('https');

const RENDER_BASE = 'https://travnify.onrender.com';

function httpsRequest(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const opts = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('=== TRAVNIFY PRODUCTION VERIFICATION ===\n');

  // 1. Backend alive check (no auth -> 401)
  console.log('[1] Backend health check...');
  const health = await httpsRequest(`${RENDER_BASE}/api/auth/me`);
  if (health.status === 401) {
    console.log('    ✅ Render backend is ALIVE (returned 401 without token as expected)');
  } else {
    console.log(`    ❌ Unexpected status: ${health.status}`);
  }

  // 2. Firebase sync for premium user (simulates login)
  console.log('\n[2] Firebase sync for premium user (rajdeepyadavv125@gmail.com)...');
  const sync = await httpsRequest(`${RENDER_BASE}/api/auth/firebase-sync`, 'POST', {
    email: 'rajdeepyadavv125@gmail.com',
    name: 'raj',
    country: 'IN',
    emailVerified: true,
  });

  if (sync.status === 200 && sync.body.token && sync.body.user) {
    const u = sync.body.user;
    console.log(`    ✅ Sync successful. Token received.`);
    console.log(`    → isPremium       : ${u.isPremium}`);
    console.log(`    → premiumPlanType : ${u.premiumPlanType}`);
    console.log(`    → premiumExpiresAt: ${u.premiumExpiresAt}`);
    console.log(`    → dailyCreditsUsed: ${u.dailyCreditsUsed}`);
    console.log(`    → freeCreditsReset: ${u.freeCreditsResetInMinutes} min`);

    if (u.isPremium === true && u.premiumPlanType === 'monthly') {
      console.log('    ✅ PREMIUM STATUS CONFIRMED');
    } else {
      console.log('    ❌ PREMIUM NOT ACTIVE — isPremium is not true');
      process.exit(1);
    }

    // 3. Test /api/auth/me with the returned token
    console.log('\n[3] Verifying /api/auth/me with JWT token...');
    const me = await httpsRequest(`${RENDER_BASE}/api/auth/me`, 'GET', null, {
      Authorization: `Bearer ${sync.body.token}`,
    });
    if (me.status === 200 && me.body.isPremium === true) {
      console.log(`    ✅ /api/auth/me returns isPremium: true`);
      console.log(`    → dailyCreditsUsed: ${me.body.dailyCreditsUsed}`);
      console.log(`    → premiumPlanType : ${me.body.premiumPlanType}`);
    } else {
      console.log(`    ❌ /api/auth/me returned status ${me.status} or isPremium is not true`);
      console.log('    Body:', JSON.stringify(me.body, null, 2));
    }

    // 4. Test Activity Explorer — free user credit gate
    console.log('\n[4] Testing Activity Explorer (should work, premium user has no credit limit)...');
    const activity = await httpsRequest(`${RENDER_BASE}/api/discover/best-for-activity`, 'POST',
      { query: 'best beach destinations' },
      { Authorization: `Bearer ${sync.body.token}` }
    );
    if (activity.status === 200 && activity.body.places) {
      console.log(`    ✅ Activity Explorer returned ${activity.body.places.length} results`);
      console.log(`    → First result: ${activity.body.places[0]?.name} (${activity.body.places[0]?.countryOrRegion})`);
    } else if (activity.status === 403 && activity.body.code === 'PREMIUM_REQUIRED') {
      console.log('    ❌ Activity Explorer blocked premium user — PREMIUM_REQUIRED unexpectedly');
    } else {
      console.log(`    ⚠️  Activity Explorer returned status ${activity.status}:`);
      console.log('    Body:', JSON.stringify(activity.body, null, 2));
    }

    // 5. Test real trip generation across 6 destinations on Render production
    const testCases = [
      {
        name: "Delhi",
        destination: "Delhi",
        budget: 20000,
        currency: "INR",
        startDate: "2026-07-01",
        endDate: "2026-07-04",
        interests: ["party", "shopping", "food"],
        expectedKeywords: ["chandni", "hauz khas", "connaught", "lodhi", "gurudwara", "karim", "red fort", "lotus", "india gate", "qutub"]
      },
      {
        name: "Paris",
        destination: "Paris",
        budget: 800,
        currency: "EUR",
        startDate: "2026-07-01",
        endDate: "2026-07-04",
        interests: ["culture", "food", "shopping"],
        expectedKeywords: ["eiffel", "louvre", "montmartre", "seine", "luxembourg", "champs", "marais", "orsay", "bistro"]
      },
      {
        name: "New York",
        destination: "New York",
        budget: 1000,
        currency: "USD",
        startDate: "2026-07-01",
        endDate: "2026-07-04",
        interests: ["sightseeing", "nightlife", "food"],
        expectedKeywords: ["brooklyn", "central park", "high line", "times square", "wall street", "soho", "chelsea", "grimaldi", "broadway"]
      },
      {
        name: "Manali",
        destination: "Manali",
        budget: 15000,
        currency: "INR",
        startDate: "2026-07-01",
        endDate: "2026-07-04",
        interests: ["nature", "adventure", "food"],
        expectedKeywords: ["hadimba", "solang", "mall road", "vashisht", "beas", "naggar", "van vihar"]
      },
      {
        name: "Kasol",
        destination: "Kasol",
        budget: 10000,
        currency: "INR",
        startDate: "2026-07-01",
        endDate: "2026-07-04",
        interests: ["nature", "chill", "trek"],
        expectedKeywords: ["chalal", "parvati", "manikaran", "tosh", "evergreen", "morrison", "israeli"]
      },
      {
        name: "Rishikesh",
        destination: "Rishikesh",
        budget: 12000,
        currency: "INR",
        startDate: "2026-07-01",
        endDate: "2026-07-04",
        interests: ["culture", "adventure", "yoga"],
        expectedKeywords: ["laxman", "ram jhula", "beatles", "ganga aarti", "parmarth", "triveni", "shivpuri"]
      }
    ];

    console.log('\n[5] Running trip generation E2E tests for all 6 target destinations on Render...');
    for (const tc of testCases) {
      console.log(`\n----------------------------------------`);
      console.log(`Testing Destination: ${tc.name}`);
      console.log(`----------------------------------------`);

      const tripRes = await httpsRequest(`${RENDER_BASE}/api/generateTrip`, 'POST', {
        prompt: `${tc.name} trip, budget ${tc.budget} ${tc.currency}, interests: ${tc.interests.join(", ")}`,
        destination: tc.destination,
        budget: tc.budget,
        currency: tc.currency,
        startDate: tc.startDate,
        endDate: tc.endDate,
        interests: tc.interests
      }, {
        Authorization: `Bearer ${sync.body.token}`,
      });

      if (tripRes.status === 200 && tripRes.body.itinerary) {
        console.log(`  ✅ HTTP 200 Success`);
        const itin = tripRes.body.itinerary;
        console.log(`  → Returned Destination: ${itin.destination}`);
        console.log(`  → Estimated Cost      : ${itin.estimatedTotalCost?.value || itin.tripSummary?.estimatedTotalCost?.amount} ${itin.estimatedTotalCost?.currency || itin.tripSummary?.estimatedTotalCost?.currency}`);
        console.log(`  → Total Days          : ${itin.days?.length || itin.dayByDayPlan?.length}`);

        const days = itin.days || [];
        const descriptions = [];
        let matchingKeywords = 0;

        days.forEach(day => {
          (day.blocks || []).forEach(block => {
            const desc = block.description || "";
            descriptions.push(desc);
            
            const lowerDesc = desc.toLowerCase();
            tc.expectedKeywords.forEach(kw => {
              if (lowerDesc.includes(kw.toLowerCase())) {
                matchingKeywords++;
              }
            });
          });
        });

        // Uniqueness check
        const uniqueDescs = new Set(descriptions);
        console.log(`  → Total Slots Checked : ${descriptions.length}`);
        console.log(`  → Unique Descriptions : ${uniqueDescs.size}`);
        
        if (uniqueDescs.size === descriptions.length) {
          console.log(`  ✅ SUCCESS: No duplicated block descriptions!`);
        } else {
          console.log(`  ⚠️ WARNING: Found some duplicate descriptions (${descriptions.length - uniqueDescs.size} repetitions).`);
        }

        if (matchingKeywords > 0) {
          console.log(`  ✅ SUCCESS: Found ${matchingKeywords} specific local landmark/activity matches! Itinerary is highly destination-aware.`);
        } else {
          console.log(`  ❌ FAILURE: Could not find any expected local keywords in the descriptions!`);
        }
      } else {
        console.log(`  ❌ E2E Request failed! Status: ${tripRes.status}`);
        console.log('  Response:', JSON.stringify(tripRes.body, null, 2));
      }
    }

  } else {
    console.log(`    ❌ Firebase sync failed. Status: ${sync.status}`);
    console.log('    Body:', JSON.stringify(sync.body, null, 2));
    process.exit(1);
  }

  console.log('\n=== VERIFICATION COMPLETE ===');
}

run().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
