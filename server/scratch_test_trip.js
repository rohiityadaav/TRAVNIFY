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
  // Scenario 1: Paris
  await runTest("Paris, 3 days, 500 EUR, culture + food", {
    prompt: "Paris for 3 days, budget 500 EUR, culture and food",
    destination: "Paris",
    budget: 500,
    currency: "EUR",
    startDate: "2026-07-01",
    endDate: "2026-07-03",
    interests: ["culture", "food"]
  });

  // Scenario 2: Bali
  await runTest("Bali, 5 days, 300 USD, beach + nightlife", {
    prompt: "Bali for 5 days, budget 300 USD, beach and nightlife",
    destination: "Bali",
    budget: 300,
    currency: "USD",
    startDate: "2026-08-10",
    endDate: "2026-08-14",
    interests: ["beach", "nightlife"]
  });

  // Scenario 3: Tokyo
  await runTest("Tokyo, 4 days, 800 USD, shopping + anime/culture", {
    prompt: "Tokyo for 4 days, budget 800 USD, shopping and anime/culture",
    destination: "Tokyo",
    budget: 800,
    currency: "USD",
    startDate: "2026-09-05",
    endDate: "2026-09-08",
    interests: ["shopping", "culture"]
  });

  // Scenario 4: Bihar
  await runTest("Bihar, 3 days, 20000 INR, culture + food", {
    prompt: "Bihar for 3 days, budget 20000 INR, culture and food",
    destination: "Bihar",
    budget: 20000,
    currency: "INR",
    startDate: "2026-10-15",
    endDate: "2026-10-17",
    interests: ["culture", "food"]
  });
}

main();
