import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} Travnify</span>
      <div className="footer-links">
        <Link to="/terms" className="footer-link">Terms & Conditions</Link>
        <Link to="/privacy" className="footer-link">Privacy Policy</Link>
        <a href="mailto:travnify@gmail.com" className="footer-link">Contact: travnify@gmail.com</a>
      </div>
    </footer>
  );
};

export default Footer;
