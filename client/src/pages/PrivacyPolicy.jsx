import React, { useEffect } from "react";

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy — Travnify";
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Review the Privacy Policy of Travnify to understand how we secure user data via Supabase and Firebase, process payments via Razorpay, and track analytics using PostHog and Sentry.');
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
      <h1 style={{ color: "var(--text-dark)", marginBottom: "0.5rem", fontFamily: "var(--font-heading)" }}>Privacy Policy</h1>
      <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "2.5rem" }}>Last updated: June 23, 2026</p>
      
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>1. Introduction</h2>
        <p>
          Welcome to Travnify. We respect your privacy and are committed to protecting your personal data. This Privacy Policy describes how we collect, store, process, and protect your information when you use our AI Travel Assistant website and services.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>2. Data We Collect and Store</h2>
        <p style={{ marginBottom: "0.8rem" }}>
          We collect and store information that you provide to us to enable trip planning and user account functionalities:
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li><strong>Identity & Account Data:</strong> Your name, email address, password hash, and preferences (such as preferred currency) are processed and managed securely via <strong>Firebase Authentication</strong>.</li>
          <li><strong>User Profiles & Trips:</strong> User profile details (email, name, role) and all saved itineraries (destination, dates, interests, activities, and budget limits) are stored in our secure <strong>Supabase Postgres database</strong>.</li>
          <li><strong>Analytics Events:</strong> We collect user interaction data (such as clicks, signups, and trip generation parameters) using <strong>PostHog</strong> and error monitoring metrics using <strong>Sentry</strong>. These events are captured in a pseudonymous way to improve product reliability and performance.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>3. How We Use Your Data</h2>
        <p style={{ marginBottom: "0.8rem" }}>We use the collected data for the following purposes:</p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li>To generate customized day-by-day travel itineraries via AI.</li>
          <li>To manage user accounts, roles (standard user/admin), and daily credit limits.</li>
          <li>To debug and monitor application stability using Sentry.</li>
          <li>To analyze feature usage and optimize the user flow using PostHog.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>4. Payments & Razorpay Security</h2>
        <p style={{ marginBottom: "0.8rem" }}>
          Travnify integrates with <strong>Razorpay</strong> to handle secure premium subscriptions and billing transactions.
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li><strong>No Stored Card Details:</strong> Travnify does not collect, process, or store sensitive financial details (such as credit/debit card numbers, CVVs, UPI PINs, or banking credentials) on our servers.</li>
          <li><strong>Razorpay Processing:</strong> All payment details are processed directly and securely by Razorpay, complying with standard PCI-DSS regulations. We only store payment receipt tokens and subscription timestamps in our Supabase database to verify payment status.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "var(--text-dark)", fontSize: "1.3rem", marginBottom: "0.8rem", fontWeight: "700" }}>5. Data Retention, Export & Deletion</h2>
        <p style={{ marginBottom: "0.8rem" }}>
          We retain your profile details and saved itineraries for as long as your account remains active.
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li><strong>Data Export:</strong> You can export and download your complete day-by-day itineraries as high-fidelity PDF documents at any time.</li>
          <li><strong>Account Deletion:</strong> You have the right to request the permanent deletion of your account and all associated itineraries from our databases. To do so, please email us at <a href="mailto:travnify@gmail.com" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>travnify@gmail.com</a>. Deletion requests are typically processed within 48 hours.</li>
        </ul>
      </section>

      <section style={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)", paddingTop: "1.5rem" }}>
        <p>
          If you have any questions or requests regarding your personal data and privacy, please contact us at:{" "}
          <a href="mailto:travnify@gmail.com" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>travnify@gmail.com</a>.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
