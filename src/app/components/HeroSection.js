import React, { useState, useEffect } from 'react';
import { Button } from 'reactstrap';
import { FaGithub, FaExternalLinkAlt, FaRocket, FaTimes, FaBook, FaInfoCircle, FaBars } from 'react-icons/fa';
import './HeroSection.css';

const HeroSection = () => {
  const [isMinimized, setIsMinimized] = useState(true);

  // Check if user has previously dismissed the banner
  useEffect(() => {
    const isDismissed = localStorage.getItem('heroSectionDismissed');
    if (isDismissed === 'true') {
      setIsMinimized(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsMinimized(true);
    localStorage.setItem('heroSectionDismissed', 'true');
  };

  const handleRestore = () => {
    setIsMinimized(false);
    localStorage.removeItem('heroSectionDismissed');
  };

  if (isMinimized) {
    return (
      <div className="HeroSection__minimized">
        <div className="HeroSection__minimizedContent">
          <span>🚀 Predictive Database Demo - 11 ML Features</span>
          <span className="HeroSection__menuHint"><FaBars /> Explore all demos</span>
          <Button
            size="sm"
            color="link"
            onClick={handleRestore}
            className="HeroSection__restoreBtn"
          >
            Show Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="HeroSection">
      <button 
        className="HeroSection__dismissBtn"
        onClick={handleDismiss}
        aria-label="Dismiss banner"
      >
        <FaTimes />
      </button>
      <div className="HeroSection__container">
        <h1 className="HeroSection__title">
          Aito.ai Predictive Database Demo
        </h1>
        <p className="HeroSection__subtitle">
          11 production-ready ML features demonstrating predictive database capabilities. Query-based inference without model training or MLOps infrastructure.
          <span className="HeroSection__metrics"> Real-time predictions via SQL-like queries.</span>
        </p>
        
        <div className="HeroSection__stats">
          <div className="HeroSection__stat">
            <span className="HeroSection__statValue">0.92</span>
            <span className="HeroSection__statLabel">Demo Confidence</span>
          </div>
          <div className="HeroSection__stat">
            <span className="HeroSection__statValue">20-50ms</span>
            <span className="HeroSection__statLabel">API Response</span>
          </div>
          <div className="HeroSection__stat">
            <span className="HeroSection__statValue">90K+</span>
            <span className="HeroSection__statLabel">Demo Records</span>
          </div>
          <div className="HeroSection__stat">
            <span className="HeroSection__statValue">Zero</span>
            <span className="HeroSection__statLabel">Training Steps</span>
          </div>
        </div>

        <div className="HeroSection__cta">
          <Button
            color="primary"
            size="lg"
            href="https://console.aito.ai/databases/aito-demo/workbooks"
          >
            <FaBook /> View Underlying Workbook
          </Button>
          <Button
            color="secondary"
            size="lg"
            href="https://aito.ai"
          >
            <FaInfoCircle /> What is Aito?
          </Button>
        </div>

        <p className="HeroSection__menuHint HeroSection__menuHint--expanded">
          <FaBars /> 11 ML demos available - explore via menu
        </p>

        <div className="HeroSection__cta HeroSection__cta--secondary">
          <Button
            color="secondary"
            size="lg"
            href="https://github.com/AitoDotAI/aito-demo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub /> Explore Implementation
          </Button>
          <Button
            color="secondary"
            size="lg"
            href="https://aito.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaExternalLinkAlt /> API Documentation
          </Button>
        </div>

        <div className="HeroSection__demo-note">
          <FaRocket /> This is one example built on Aito's predictive database. Switch users to observe personalization.
        </div>

        <div className="HeroSection__features">
          <h3>Technical Implementation:</h3>
          <ul className="HeroSection__featureList">
            <li>✓ Query-based search ranking with $similarity and $p operators</li>
            <li>✓ Goal-oriented recommendations using _recommend endpoint</li>
            <li>✓ Text classification via _predict without training data</li>
            <li>✓ Statistical correlation discovery with _relate queries</li>
            <li>✓ Multi-field prediction for document routing workflows</li>
            <li>✓ Contextual AI tools with real-time inference APIs</li>
          </ul>
          <div className="HeroSection__technical">
            <h4>Architecture Details:</h4>
            <ul>
              <li>• 90,087 impression records in demo (platform scales to 10M+ samples)</li>
              <li>• 11 interconnected tables with relational links</li>
              <li>• 6 core API endpoints: _query, _predict, _recommend, _relate, _batch, _aggregate</li>
              <li>• Live queries against shared demo instance (20-50ms API response time)</li>
            </ul>
          </div>
          <p className="HeroSection__techNote">
            Predictive database approach: SQL-like queries return ML predictions instead of raw data.
            <a href="https://github.com/AitoDotAI/aito-demo#what-i-built" target="_blank"> View code examples →</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;