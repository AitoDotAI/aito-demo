import React, { useState } from 'react';
import { Tooltip } from 'reactstrap';
import axios from 'axios';
import config from '../../config';

/**
 * Accurate Aito.ai explanation tooltip that maintains 1-to-1 mapping with API results
 * Shows base probability, pattern matches with statistics, and allows drill-down to examples
 */
const AitoExplanationTooltip = ({ 
  field, 
  value, 
  probability, 
  why, 
  isOpen, 
  toggle, 
  targetId,
  inputData 
}) => {
  const [showInvoices, setShowInvoices] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [relateStats, setRelateStats] = useState({});

  // Fetch pattern statistics using _relate
  const fetchPatternStats = async (proposition, factor) => {
    try {
      const response = await axios.post(`${config.aito.url}/api/v1/_relate`, {
        from: 'invoices',
        where: proposition,
        get: field,
        limit: 10
      }, {
        headers: { 'x-api-key': config.aito.apiKey }
      });

      const stats = response.data.items.find(item => item.feature === value);
      return {
        matched: stats ? stats.count : 0,
        total: response.data.items.reduce((sum, item) => sum + item.count, 0)
      };
    } catch (error) {
      console.error('Error fetching pattern stats:', error);
      return { matched: 0, total: 0 };
    }
  };

  // Fetch actual invoice examples for a pattern
  const fetchInvoiceExamples = async (proposition) => {
    try {
      const response = await axios.post(`${config.aito.url}/api/v1/_query`, {
        from: 'invoices',
        where: {
          $and: [
            proposition,
            { [field]: value }
          ]
        },
        select: ['InvoiceID', 'Date', 'Amount', 'Description', field],
        limit: 10,
        orderBy: [{ field: 'Date', direction: 'desc' }]
      }, {
        headers: { 'x-api-key': config.aito.apiKey }
      });

      return response.data.rows;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  };

  // Handle pattern click to show invoice examples
  const handlePatternClick = async (pattern) => {
    setSelectedPattern(pattern);
    const invoices = await fetchInvoiceExamples(pattern.proposition);
    setInvoiceData(invoices);
    setShowInvoices(true);
  };

  // Format the proposition into readable text with highlights
  const formatProposition = (factor) => {
    if (factor.highlight && factor.highlight.length > 0) {
      const highlights = factor.highlight.map(h => ({
        field: h.field.replace('invoices.', ''),
        value: h.highlight
      }));

      return (
        <span>
          {highlights.map((h, i) => (
            <span key={i}>
              {i > 0 && ' and '}
              <span className="field-name">{h.field}</span> {h.field.includes('Amount') ? 'is' : 'contains'} <mark>{h.value}</mark>
            </span>
          ))}
        </span>
      );
    }
    return <span>Complex pattern</span>;
  };

  // Process factors from the $why explanation
  const processedFactors = why.factors.map((factor, index) => {
    if (factor.type === 'baseP') {
      return {
        type: 'base',
        value: factor.value,
        description: `${value} processes ${(factor.value * 100).toFixed(0)}% of all invoices historically`
      };
    } else if (factor.type === 'product') {
      // Skip normalization factors
      return null;
    } else if (factor.type === 'relatedPropositionLift') {
      // Fetch stats for this pattern if not already cached
      if (!relateStats[index]) {
        fetchPatternStats(factor.proposition, factor).then(stats => {
          setRelateStats(prev => ({ ...prev, [index]: stats }));
        });
      }

      return {
        type: 'pattern',
        lift: factor.value,
        proposition: factor.proposition,
        description: formatProposition(factor),
        stats: relateStats[index] || { matched: 0, total: 0 }
      };
    }
    return null;
  }).filter(Boolean);

  // Calculate final probability
  const baseProbability = processedFactors.find(f => f.type === 'base')?.value || 0;
  const lifts = processedFactors.filter(f => f.type === 'pattern').map(f => f.lift);
  
  return (
    <>
      <Tooltip
        autohide={false}
        flip={false}
        isOpen={isOpen && !showInvoices}
        target={targetId}
        toggle={toggle}
        placement="bottom-end"
        className="aito-explanation-wrapper"
      >
        <div className="aito-explanation-content">
          <div className="explanation-header">
            <h4>Prediction Analysis: {value}</h4>
            <span className={`confidence-badge ${probability >= 0.8 ? 'high' : ''}`}>
              {(probability * 100).toFixed(0)}% probability
            </span>
          </div>
          
          <div className="explanation-breakdown">
            {processedFactors.map((factor, index) => (
              <div 
                key={index}
                className={`factor-section ${factor.type === 'pattern' ? 'pattern clickable' : ''}`}
                onClick={() => factor.type === 'pattern' && handlePatternClick(factor)}
              >
                <div className="factor-header">
                  <span className="factor-type">
                    {factor.type === 'base' ? 'Base Probability' : 'Pattern Match'}
                  </span>
                  <span className={factor.type === 'base' ? 'factor-value' : 'factor-impact'}>
                    {factor.type === 'base' ? 
                      `${(factor.value * 100).toFixed(0)}%` : 
                      `× ${factor.lift.toFixed(1)}`
                    }
                  </span>
                </div>
                
                {factor.type === 'base' ? (
                  <div className="factor-description">{factor.description}</div>
                ) : (
                  <div className="pattern-content">
                    <div className="pattern-description">
                      When {factor.description}
                    </div>
                    {factor.stats.total > 0 && (
                      <div className="pattern-stats">
                        <span className="stat-icon">📊</span>
                        {value} selected in <strong>{factor.stats.matched} of {factor.stats.total}</strong> matching invoices 
                        ({((factor.stats.matched / factor.stats.total) * 100).toFixed(0)}%)
                      </div>
                    )}
                  </div>
                )}
                
                {factor.type === 'pattern' && (
                  <div className="expand-hint">Click to view invoices →</div>
                )}
              </div>
            ))}
            
            <div className="calculation-summary">
              <div className="calculation-line">
                <span>Base: {(baseProbability * 100).toFixed(0)}%</span>
                {lifts.map((lift, i) => (
                  <span key={i}>× {lift.toFixed(1)}</span>
                ))}
                <span>= {(probability * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </Tooltip>

      {/* Invoice Examples Modal */}
      {showInvoices && (
        <div className="invoice-modal visible" onClick={() => setShowInvoices(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Matching Invoices</h3>
              <button className="close-modal" onClick={() => setShowInvoices(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="pattern-info">
                <strong>Pattern:</strong> When {selectedPattern?.description}
              </div>
              
              {selectedPattern?.stats && (
                <div className="invoice-stats">
                  <div className="stat-box">
                    <div className="stat-number">{selectedPattern.stats.matched}</div>
                    <div className="stat-label">Processed by {value}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-number">
                      {selectedPattern.stats.total - selectedPattern.stats.matched}
                    </div>
                    <div className="stat-label">Processed by others</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-number">
                      {((selectedPattern.stats.matched / selectedPattern.stats.total) * 100).toFixed(0)}%
                    </div>
                    <div className="stat-label">Match rate</div>
                  </div>
                </div>
              )}
              
              <h4>Recent Examples</h4>
              <div className="invoice-table">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Description</th>
                      <th>{field}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData?.map((invoice, i) => (
                      <tr key={i}>
                        <td>{invoice.InvoiceID}</td>
                        <td>{new Date(invoice.Date).toLocaleDateString()}</td>
                        <td>${invoice.Amount.toLocaleString()}</td>
                        <td>{invoice.Description}</td>
                        <td className="highlight">{invoice[field]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AitoExplanationTooltip;