import React from 'react';

const Footer = () => {
  return (
    <footer className="footer animate-fade-in">
      <div className="footer-content">
        <div className="footer-text">
          Designed and Developed by 
          <span className="signature">Saroj Padhi</span>
        </div>
        
        <div className="social-links">
          <a 
            href="https://www.linkedin.com/in/saroj-padhi-492979270" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-link"
          >
            LinkedIn
          </a>
          <a 
            href="https://github.com/saroj-02" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-link"
          >
            GitHub
          </a>
          <a 
            href="https://portfolio-8-4qo4.onrender.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-link"
          >
            Portfolio
          </a>
        </div>
        
        <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem', marginTop: '10px' }}>
          © 2026 Aura Task Suite • All Rights Reserved
        </div>
      </div>
    </footer>
  );
};

export default Footer;
