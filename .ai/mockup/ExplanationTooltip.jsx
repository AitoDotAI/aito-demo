import React from 'react';
import { Tooltip } from 'reactstrap';

/**
 * Clean, professional explanation tooltip for invoice predictions
 * Showcases Aito.ai's text highlighting feature in a business-friendly format
 */
const ExplanationTooltip = ({ 
  field, 
  value, 
  probability, 
  factors, 
  isOpen, 
  toggle, 
  targetId 
}) => {
  // Transform technical factors into business-friendly explanations
  const transformFactors = (factors) => {
    return factors.map((factor, index) => {
      const { type, value, proposition, highlight } = factor;
      
      // Skip normalization factors - internal calculation detail
      if (type === 'product') return null;
      
      // Base probability - show as historical pattern
      if (type === 'baseP') {
        return {
          icon: '✓',
          text: `Historical baseline: ${(value * 100).toFixed(0)}% of similar invoices`,
          isPrimary: false
        };
      }
      
      // Proposition lift - convert to business insight with highlights
      if (type === 'relatedPropositionLift') {
        // Extract highlighted terms from the factor
        let explanation = '';
        
        if (highlight && highlight.length > 0) {
          // Build explanation with highlighted terms
          const highlights = highlight.map(h => {
            const fieldName = h.field.replace('invoices.', '');
            return { field: fieldName, value: h.highlight };
          });
          
          // Create contextual explanations based on field types
          if (highlights.some(h => h.field === 'SenderName')) {
            const vendor = highlights.find(h => h.field === 'SenderName').value;
            explanation = <>Handles invoices from <mark>{vendor}</mark></>;
          } else if (highlights.some(h => h.field === 'Description')) {
            const terms = highlights
              .filter(h => h.field === 'Description')
              .map(h => <mark key={h.value}>{h.value}</mark>);
            explanation = <>Description contains {terms.reduce((prev, curr, i) => 
              [prev, i === terms.length - 1 ? ' and ' : ', ', curr])}</>;
          } else if (highlights.some(h => h.field === 'Department')) {
            const dept = highlights.find(h => h.field === 'Department').value;
            explanation = <><mark>{dept}</mark> department specialist</>;
          } else {
            // Generic highlight display
            explanation = highlights.map((h, i) => (
              <span key={i}>
                {i > 0 && ', '}
                <mark>{h.value}</mark>
              </span>
            ));
          }
        }
        
        const impact = value > 2 ? 'high' : value > 1.5 ? 'medium' : 'low';
        
        return {
          icon: impact === 'high' ? '◆' : '✓',
          text: explanation,
          isPrimary: impact === 'high',
          lift: value
        };
      }
      
      return null;
    }).filter(Boolean);
  };
  
  const transformedFactors = transformFactors(factors);
  const confidenceLevel = probability >= 0.8 ? 'high' : probability >= 0.5 ? 'medium' : 'low';
  
  return (
    <Tooltip
      autohide={false}
      flip={false}
      isOpen={isOpen}
      target={targetId}
      toggle={toggle}
      placement="bottom-end"
      className="explanation-tooltip-wrapper"
    >
      <div className="explanation-tooltip-content">
        {/* Header */}
        <div className="tooltip-header">
          <span className="tooltip-title">Why {value}?</span>
          <span className={`tooltip-confidence ${confidenceLevel}`}>
            {(probability * 100).toFixed(0)}% confident
          </span>
        </div>
        
        {/* Explanation Items */}
        <div className="explanation-content">
          {transformedFactors.map((factor, index) => (
            <div 
              key={index} 
              className={`explanation-item ${factor.isPrimary ? 'primary' : ''}`}
            >
              <div className="explanation-icon">{factor.icon}</div>
              <div className="explanation-text">{factor.text}</div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="tooltip-footer">
          Based on analysis of similar invoices
        </div>
      </div>
    </Tooltip>
  );
};

export default ExplanationTooltip;

/* 
  Required CSS to add to InvoicingPage.css:
  
  .explanation-tooltip-wrapper .tooltip-inner {
    max-width: 340px;
    padding: 0;
    background: transparent;
    text-align: left;
  }
  
  .explanation-tooltip-content {
    background: white;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    overflow: hidden;
  }
  
  .tooltip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .tooltip-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }
  
  .tooltip-confidence {
    font-size: 12px;
    font-weight: 600;
    color: #4338ca;
  }
  
  .tooltip-confidence.high { color: #166534; }
  .tooltip-confidence.medium { color: #9a3412; }
  
  .explanation-content {
    padding: 16px 18px;
  }
  
  .explanation-item {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
    align-items: flex-start;
  }
  
  .explanation-item:last-child {
    margin-bottom: 0;
  }
  
  .explanation-icon {
    font-size: 12px;
    color: #10b981;
    margin-top: 2px;
    flex-shrink: 0;
  }
  
  .explanation-item.primary .explanation-icon {
    color: #FF6B35;
    font-weight: 700;
  }
  
  .explanation-text {
    font-size: 13px;
    color: #475569;
    line-height: 1.5;
    flex: 1;
  }
  
  .explanation-text mark {
    background-color: #fef3c7;
    color: #92400e;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 500;
  }
  
  .tooltip-footer {
    padding: 12px 18px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    font-size: 12px;
    color: #64748b;
    text-align: center;
  }
*/