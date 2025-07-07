import React, { useState, useEffect } from 'react';
import { Button } from 'reactstrap';
import { FaGithub, FaExternalLinkAlt, FaRocket, FaTimes } from 'react-icons/fa';
import './HeroSection.css';

const HeroSection = () => {
  const [isMinimized, setIsMinimized] = useState(false);

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
          <span>🚀 ML Features Without the ML Pipeline - Built in one weekend</span>
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
          ML Features Without the ML Pipeline
        </h1>
        <p className="HeroSection__subtitle">
          Built 9 working ML features in one weekend using predictive queries instead of model training. 
          <span className="HeroSection__metrics"> Sub-200ms predictions. No MLOps required.</span>
        </p>
        
        <div className="HeroSection__stats">
          <div className="HeroSection__stat">
            <span className="HeroSection__statValue">85%</span>
            <span className="HeroSection__statLabel">Search Relevance</span>
          </div>
          <div className="HeroSection__stat">
            <span className="HeroSection__statValue">&lt;200ms</span>
            <span className="HeroSection__statLabel">Query Time</span>
          </div>
          <div className="HeroSection__stat">
            <span className="HeroSection__statValue">2 hours</span>
            <span className="HeroSection__statLabel">Setup Time</span>
          </div>
          <div className="HeroSection__stat">
            <span className="HeroSection__statValue">$0</span>
            <span className="HeroSection__statLabel">Training Cost</span>
          </div>
        </div>

        <div className="HeroSection__cta">
          <Button 
            color="primary" 
            size="lg"
            href="https://github.com/aito-ai/grocery-store-demo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub /> View Source Code
          </Button>
          <Button 
            color="secondary" 
            size="lg"
            href="/docs/blog-post.md"
            target="_blank"
          >
            <FaExternalLinkAlt /> Read Technical Post
          </Button>
        </div>

        <div className="HeroSection__demo-note">
          <FaRocket /> Try the live demo below - no signup required. Switch users to see personalization in action.
        </div>

        <div className="HeroSection__features">
          <h3>What's Implemented:</h3>
          <ul className="HeroSection__featureList">
            <li>✓ Personalized search that learns from behavior</li>
            <li>✓ Dynamic recommendations excluding cart items</li>
            <li>✓ NLP classification without training data</li>
            <li>✓ Statistical correlation discovery</li>
            <li>✓ Document field extraction & routing</li>
            <li>✓ AI assistants with predictive tools</li>
          </ul>
          <p className="HeroSection__techNote">
            All powered by SQL-like queries that return predictions instead of data. 
            <a href="/docs/use-cases/01-smart-search.md" target="_blank"> See implementation →</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;