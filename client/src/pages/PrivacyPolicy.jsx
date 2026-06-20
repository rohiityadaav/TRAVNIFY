import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="legal-page" style={{
      padding: "3rem 1.5rem",
      maxWidth: "800px",
      margin: "0 auto",
      textAlign: "left",
      color: "var(--text-medium)",
      lineHeight: "1.7"
    }}>
      <h1 style={{ color: "var(--text-dark)", marginBottom: "0.5rem", fontFamily: "var(--font-heading)" }}>Privacy Policy</h1>
      <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "2.5rem" }}>Last updated: June 19, 2026</p>
      
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>1. Introduction</h2>
        <p>
          Welcome to Travnify. We respect your privacy and are committed to protecting your personal data. This Privacy Policy describes how we collect, store, share, and protect your information when you use our AI Travel Assistant website and services.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>2. Data We Collect</h2>
        <p style={{ marginBottom: "0.8rem" }}>
          We collect information that you voluntarily provide to us when you create an account, save trip schedules, and interact with our tools:
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li><strong>Identity & Account Data:</strong> Your name, email address, password hash, and preferred settings (such as preferred planning currency) which are processed and managed securely via <strong>Firebase Authentication</strong>.</li>
          <li><strong>Travel Preferences:</strong> Travel destination inputs, start/end dates, group configuration, vibes/interests selection, and must-do/avoid parameters.</li>
          <li><strong>Saved Itineraries:</strong> Complete day-by-day schedules, activities, estimated costs, and notes linked to your account.</li>
          <li><strong>Transaction Logs:</strong> When upgrading to Premium, payments are processed directly by our secure payment gateway partner <strong>Razorpay</strong>. We do not collect or store full credit/debit card numbers or bank credentials on our servers. We only store payment status, receipt IDs, and purchase timestamps.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>3. How We Use Your Data</h2>
        <p style={{ marginBottom: "0.8rem" }}>We use the collected data for the following purposes:</p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li>To generate custom, budget-disciplined day-by-day travel itineraries.</li>
          <li>To manage user accounts, check credit limits, and authenticate premium gates.</li>
          <li>To process upgrades and subscriptions via Razorpay.</li>
          <li>To operate and maintain our database systems.</li>
          <li>To send support emails and alerts regarding account status.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>4. Third-Party Integrations & Sharing</h2>
        <p style={{ marginBottom: "0.8rem" }}>
          To provide full functionality, we integrate with secure third-party services:
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li><strong>Firebase Authentication:</strong> Managed user authentication and verification.</li>
          <li><strong>Google Places & Maps API:</strong> Used for coordinate resolution, auto-complete queries, and locating transit points.</li>
          <li><strong>Google Gemini API:</strong> The core AI engine which generates the itinerary schedules. No personal identity data (like email or name) is passed to the Gemini LLM.</li>
          <li><strong>Razorpay:</strong> Handles secure transactions, token verification, and billing.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>5. Data Security & Retention</h2>
        <p style={{ marginBottom: "0.8rem" }}>
          We employ standard industry security protocols to prevent unauthorized access, loss, or disclosure of data. We retain account profile details and itineraries for as long as your account is active.
        </p>
        <p>
          You can request the permanent deletion of your account and all associated itineraries at any time by contacting us directly at <a href="mailto:travnify@gmail.com" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>travnify@gmail.com</a>. Account deletion requests are typically processed within 48 hours.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>6. Cookies</h2>
        <p>
          We do not use tracking or advertising cookies. We only use browser local storage (`localStorage`) to store your secure JSON Web Token (JWT) so you remain signed in across page reloads.
        </p>
      </section>

      <section style={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)", paddingTop: "1.5rem" }}>
        <p>
          If you have any questions or requests about your personal data, contact us at:{" "}
          <a href="mailto:travnify@gmail.com" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>travnify@gmail.com</a>.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
