import React, { useEffect } from "react";

const TermsAndConditions = () => {
  useEffect(() => {
    document.title = "Terms & Conditions — Travnify";
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Read the Terms and Conditions of Travnify to understand AI-generated itinerary limitations, transport recommendations, and secure billing processed via Razorpay.');
  }, []);

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
      <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "2.5rem" }}>Last updated: June 23, 2026</p>
      
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>1. Acceptance of Terms</h2>
        <p>
          By creating an account, accessing, or using the Travnify website and AI travel assistant planning tools (collectively, the "Services"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use our Services.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>2. AI-Generated Recommendations Disclaimer</h2>
        <p style={{ marginBottom: "0.8rem" }}>
          Travnify provides travel planning services, including AI-generated day-by-day itineraries, local sights, transit notes, and high-fidelity PDF exports.
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li><strong>Best-Effort Suggestions:</strong> All generated itineraries, transport suggestions ("How to Reach"), and estimated costs are recommendations generated via Artificial Intelligence. They are provided on a best-effort basis and may not always be perfectly accurate, complete, or up-to-date.</li>
          <li><strong>No Guarantees:</strong> Travnify does not guarantee availability, pricing, operating schedules, road conditions, booking options, or safety of any suggested transport routes, attractions, hotels, or eateries.</li>
          <li><strong>No Bookings:</strong> Travnify is NOT a travel booking agency, airline, hotelier, or reservation agent. We do not sell or arrange flights, hotel stays, rentals, or activity tickets. Users are solely responsible for verifying details and booking services directly with official providers.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>3. Third-Party Service Disclaimers</h2>
        <p style={{ marginBottom: "0.8rem" }}>
          Our planning tool suggests routes and connections operated by third-party service providers (such as airlines, train systems, bus routes, local guides, and hotels).
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li><strong>Independent Providers:</strong> Travnify has no control over, and assumes no responsibility for, the services, performance, cancellations, delays, safety records, or policies of any third-party providers.</li>
          <li><strong>User Responsibility:</strong> Any interaction, booking, or transaction with third-party service providers is strictly between you and the respective provider. Travnify is not liable for any losses, injuries, or delays incurred during your travels.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>4. Subscriptions, Payments & Razorpay</h2>
        <p style={{ marginBottom: "0.8rem" }}>
          Travnify offers both free and premium access plans:
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li><strong>Free Credits:</strong> Free users receive 5 planning credits per day. Each credit allows the generation of one itinerary. Unused daily credits expire and do not roll over.</li>
          <li><strong>Premium Upgrades:</strong> Users can upgrade to a Premium subscription to unlock unlimited itinerary generations, advanced local transit lookups, and premium PDF exports.</li>
          <li><strong>Razorpay Integration:</strong> All premium subscription payments are processed securely via our payment gateway partner, <strong>Razorpay</strong>. By upgrading, you agree that Razorpay's own Terms of Service and Privacy Policy apply to the payment steps and data processing.</li>
          <li><strong>Refund Policy:</strong> If you are unsatisfied with your Premium purchase, you may request a refund within 7 days of payment by contacting us at <a href="mailto:travnify@gmail.com" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>travnify@gmail.com</a>. Refund eligibility is determined on a case-by-case basis.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>5. Account Security & Proper Use</h2>
        <p>
          You are responsible for keeping your login credentials secure. Automated scraping, scripting, or abusing our AI generation endpoints is strictly prohibited and will result in immediate account termination.
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
