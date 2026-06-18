const { generateTrip } = require('./controllers/tripController');

const runTest = async (testName, payload) => {
  console.log(`\n========================================`);
  console.log(`RUNNING TEST: ${testName}`);
  console.log(`Payload:`, JSON.stringify(payload, null, 2));
  console.log(`========================================`);
  
  const req = { body: payload };
  const res = {
    statusCode: 200,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    }
  };
  
  try {
    await generateTrip(req, res);
    console.log(`Response Status:`, res.statusCode);
    if (res.statusCode !== 200) {
      console.error(`ERROR:`, res.data);
    } else {
      console.log(`Itinerary Generated Successfully!`);
      const itinerary = res.data.itinerary;
      console.log(`Destination:`, itinerary.destination);
      console.log(`Estimated Total Cost:`, JSON.stringify(itinerary.estimatedTotalCost));
      console.log(`Days Count:`, itinerary.days.length);
      console.log(`Days Details:`);
      itinerary.days.forEach((day, idx) => {
        console.log(`  Day ${idx + 1}: ${day.title} (${day.date})`);
        day.blocks.forEach((block, bIdx) => {
          console.log(`    [${block.timeSlot}] ${block.placeName} (${block.areaOrNeighborhood}) - Cost: ${block.approxCost.value} ${block.approxCost.currency}`);
          console.log(`      Activity: ${block.activity}`);
        });
      });
      console.log(`Summary Object (Frontend Compatible):`, JSON.stringify(itinerary.summary));
      console.log(`Budget Breakdown Object (Frontend Compatible):`, JSON.stringify(itinerary.budgetBreakdown));
    }
  } catch (err) {
    console.error(`Execution Error:`, err);
  }
};

async function main() {
  const testCases = [
    {
      name: "Delhi (Big City - India)",
      destination: "Delhi",
      budget: 20000,
      currency: "INR",
      startDate: "2026-07-01",
      endDate: "2026-07-05",
      interests: ["party", "shopping", "food"]
    },
    {
      name: "Paris (Big International City)",
      destination: "Paris",
      budget: 800,
      currency: "EUR",
      startDate: "2026-07-01",
      endDate: "2026-07-04",
      interests: ["culture", "food", "shopping"]
    },
    {
      name: "New York (Big International City)",
      destination: "New York",
      budget: 1000,
      currency: "USD",
      startDate: "2026-07-01",
      endDate: "2026-07-04",
      interests: ["sightseeing", "nightlife", "food"]
    },
    {
      name: "Manali (Indian Hill Station)",
      destination: "Manali",
      budget: 15000,
      currency: "INR",
      startDate: "2026-07-01",
      endDate: "2026-07-04",
      interests: ["nature", "adventure", "food"]
    },
    {
      name: "Kasol (Indian Hill Station)",
      destination: "Kasol",
      budget: 10000,
      currency: "INR",
      startDate: "2026-07-01",
      endDate: "2026-07-04",
      interests: ["nature", "chill", "trek"]
    },
    {
      name: "Rishikesh (Indian Spiritual/Adventure Town)",
      destination: "Rishikesh",
      budget: 12000,
      currency: "INR",
      startDate: "2026-07-01",
      endDate: "2026-07-04",
      interests: ["culture", "adventure", "yoga"]
    }
  ];

  for (const tc of testCases) {
    await runTest(tc.name, {
      prompt: `${tc.destination} trip for ${tc.name}, interests: ${tc.interests.join(", ")}`,
      destination: tc.destination,
      budget: tc.budget,
      currency: tc.currency,
      startDate: tc.startDate,
      endDate: tc.endDate,
      interests: tc.interests
    });
  }
}

main();
