import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="legal-page" style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", textAlign: "left", color: "var(--text-medium)" }}>
      <h1 style={{ color: "var(--text-dark)", marginBottom: "1rem" }}>Privacy Policy</h1>
      <p style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "1.5rem" }}>Last updated: 15 June 2026</p>
      <p style={{ lineHeight: "1.6", marginBottom: "1.5rem" }}>
        This Privacy Policy explains how Travnify collects, uses, and protects your personal data.
        Replace this paragraph with full privacy policy text from a proper generator or lawyer.
      </p>
      <p style={{ lineHeight: "1.6" }}>
        If you have any questions or requests about your data, contact us at{" "}
        <a href="mailto:travnify@gmail.com" style={{ color: "var(--primary)", fontWeight: "600" }}>travnify@gmail.com</a>.
      </p>
    </div>
  );
};

export default PrivacyPolicy;
