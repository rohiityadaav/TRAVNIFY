import React from "react";

const TermsAndConditions = () => {
  return (
    <div className="legal-page" style={{
      padding: "3rem 1.5rem",
      maxWidth: "800px",
      margin: "0 auto",
      textAlign: "left",
      color: "var(--text-medium)",
      lineHeight: "1.7"
    }}>
      <h1 style={{ color: "var(--text-dark)", marginBottom: "0.5rem", fontFamily: "var(--font-heading)" }}>Terms & Conditions</h1>
      <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "2.5rem" }}>Last updated: June 19, 2026</p>
      
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>1. Acceptance of Terms</h2>
        <p>
          By creating an account, accessing, or using the Travnify website and AI travel assistant planning tools (collectively, the "Services"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use our Services.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>2. AI-Generated Recommendations Disclaimer</h2>
        <p style={{ marginBottom: "0.8rem" }}>
          Travnify provides itineraries, activities, schedules, transit guides, and budget estimations generated via Artificial Intelligence (LLM) technology.
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li><strong>Recommendations Only:</strong> All generated travel schedules are recommendations and suggestions only. Travnify does not guarantee the availability, operating hours, safety, road conditions, booking options, or pricing of any suggested flights, hotels, restaurants, monuments, or activities.</li>
          <li><strong>No Bookings:</strong> Travnify is NOT a travel booking agency or reservation system. We do not book flights, hotel stays, rentals, or tickets. Users are solely responsible for verifying details and making bookings directly with official service providers.</li>
          <li><strong>User Liability:</strong> Users assume all risks associated with travel itineraries, including transport delays, price variances, local safety hazards, weather, and physical demands.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>3. Subscriptions & Credit System</h2>
        <p style={{ marginBottom: "0.8rem" }}>
          Travnify offers both free and premium access plans:
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li><strong>Free Credits:</strong> Free users receive 5 planning credits per day. Each credit allows the generation of one itinerary or the use of specific premium explore tools. Unused daily credits expire and do not roll over to the next day.</li>
          <li><strong>Premium Upgrades:</strong> Users can purchase a Premium subscription to unlock unlimited itinerary generations, advanced "Near Me" local transit guides, and high-fidelity PDF exports.</li>
          <li><strong>Fair Use:</strong> Automated scraping, scripting, or abusing our AI generation endpoints is strictly prohibited and will result in immediate account termination.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>4. Payments & Refund Policy</h2>
        <p style={{ marginBottom: "0.8rem" }}>
          All premium billing is handled via our payment integration:
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li><strong>Razorpay Integration:</strong> Payment collection is securely processed via <strong>Razorpay</strong>. Transactions are subject to Razorpay's processing conditions.</li>
          <li><strong>Failed Payments:</strong> In the event of a failed transaction where funds were deducted but Premium status was not unlocked, please contact our support team at <a href="mailto:travnify@gmail.com" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>travnify@gmail.com</a>. We will verify the transaction token and unlock your status manually or issue a full refund within 3-5 business days.</li>
          <li><strong>Refund Policy:</strong> If you are unsatisfied with your Premium subscription, you may request a refund within 7 days of purchase. Refunds are evaluated and processed on a case-by-case basis.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>5. Account Security</h2>
        <p>
          You are responsible for keeping your login credentials secure. All activities performed under your registered account are your responsibility. If you notice any unauthorized access, please notify us immediately.
        </p>
      </section>

      <section style={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)", paddingTop: "1.5rem" }}>
        <p>
          If you have any questions or feedback about these Terms, contact us at:{" "}
          <a href="mailto:travnify@gmail.com" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>travnify@gmail.com</a>.
        </p>
      </section>
    </div>
  );
};

export default TermsAndConditions;
