import React from "react";
import { Link } from "react-router-dom";
import { Map, Mail, Twitter, Instagram, Linkedin, ShieldAlert, Star } from "lucide-react";

const Footer = () => {
  return (
    <footer style={{
      borderTop: "1px solid rgba(242, 100, 48, 0.08)",
      background: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      padding: "4rem 2rem 2rem 2rem",
      marginTop: "auto",
      width: "100%",
      boxSizing: "border-box"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "3rem",
        textAlign: "left"
      }}>
        {/* Column 1: Branding & Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              background: "#F26430",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(242, 100, 48, 0.2)"
            }}>
              <Map size={18} color="#FFFFFF" />
            </div>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: "800", fontSize: "1.25rem", color: "var(--text-dark)", letterSpacing: "0.5px" }}>TRAVNIFY</span>
          </div>
          
          <p style={{ fontSize: "0.85rem", color: "var(--text-medium)", lineHeight: "1.5" }}>
            AI-powered travel planner that designs budget-disciplined, destination-aware itineraries in seconds.
          </p>

          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
            <a href="#" className="footer-link" aria-label="Twitter"><Twitter size={18} /></a>
            <a href="#" className="footer-link" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="#" className="footer-link" aria-label="LinkedIn"><Linkedin size={18} /></a>
          </div>
        </div>

        {/* Column 2: Planner Tools */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: "700", fontSize: "0.95rem", color: "var(--text-dark)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Planner</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.88rem" }}>
            <a href="/#plan" className="footer-link" onClick={() => window.location.hash = "plan"}>Plan a Trip</a>
            <a href="/#explore" className="footer-link" onClick={() => window.location.hash = "explore"}>Explore Templates</a>
            <a href="/#near-me" className="footer-link" onClick={() => window.location.hash = "near-me"}>Discover Near Me</a>
            <a href="/#premium" className="footer-link" onClick={() => window.location.hash = "premium"} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Star size={14} fill="#F59E0B" color="#F59E0B" /> Premium Upgrade
            </a>
          </div>
        </div>

        {/* Column 3: Legal Disclosures */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: "700", fontSize: "0.95rem", color: "var(--text-dark)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Legal</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.88rem" }}>
            <Link to="/terms" className="footer-link">Terms & Conditions</Link>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <span style={{ color: "var(--text-light)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.2rem" }}>
              <ShieldAlert size={14} /> AI recommendations only
            </span>
          </div>
        </div>

        {/* Column 4: Contact & Support */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: "700", fontSize: "0.95rem", color: "var(--text-dark)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Contact</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.88rem" }}>
            <a href="mailto:travnify@gmail.com" className="footer-link" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Mail size={14} /> travnify@gmail.com
            </a>
            <span style={{ color: "var(--text-medium)", fontSize: "0.8rem", lineHeight: "1.4" }}>
              Need assistance? Email our support team and we will respond within 24 hours.
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{
        maxWidth: "1200px",
        margin: "3rem auto 0 auto",
        paddingTop: "1.5rem",
        borderTop: "1px solid rgba(0, 0, 0, 0.04)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        fontSize: "0.8rem",
        color: "var(--text-light)"
      }}>
        <span>© {new Date().getFullYear()} Travnify. All rights reserved.</span>
        <span>Designed for busy explorers.</span>
      </div>
    </footer>
  );
};

export default Footer;
