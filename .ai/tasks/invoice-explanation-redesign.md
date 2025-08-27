# Invoice Prediction Explanation Redesign

## Motivation

The current invoice prediction explanation UI needs to be more professional and comprehensible for Accounting SaaS CTOs and CPOs. These decision-makers need to quickly understand:

1. **How the AI makes decisions** - Clear, visual explanations of the prediction logic
2. **Why they should trust it** - Professional presentation that conveys reliability
3. **What value it provides** - Easy-to-grasp benefits for their accounting workflows

The current implementation shows raw mathematical factors (base probability, normalization, proposition lifts) which, while accurate, may be too technical for advertisement screenshots and sales materials.

## Diagnosis of Current Implementation

### Current Issues:

1. **Technical Jargon**: Terms like "base probability", "normalization", and "proposition lift" are data science concepts that may confuse business stakeholders
2. **Mathematical Focus**: Shows raw multipliers (e.g., "* 0.85 for normalization") instead of business-friendly explanations
3. **Poor Visual Hierarchy**: Flat list format doesn't emphasize the most important factors
4. **Unclear Value Proposition**: Doesn't immediately convey how this helps accounting teams
5. **Inconsistent Formatting**: Mix of technical notation and HTML makes it look unpolished

### Current Strengths:

1. **Accurate Information**: The underlying data is correct and comprehensive
2. **Interactive Design**: Question mark button is intuitive
3. **Real-time Updates**: Explanations update dynamically with predictions

## Plan for Improvement

### 1. Content Strategy

Maintain 1-to-1 mapping with Aito.ai's actual prediction results:

- **Base Probability** → Show as percentage with clear label
- **Normalization** → Remove from display (internal calculation detail)
- **Proposition Lifts** → Show as pattern matches with multipliers
- **Highlights** → Preserve and emphasize Aito.ai's text highlighting feature

### 2. Visual Design Improvements

Create a clean, professional explanation tooltip:

- **Clear Structure**: Base probability → Pattern matches → Final calculation
- **Highlighted Terms**: Yellow background for matched terms from $highlight
- **Professional Styling**: Clean borders, subtle shadows, proper spacing
- **Calculation Display**: Show the math (base × lifts = final)

### 3. Information Architecture

Structure explanations to showcase Aito.ai features:

1. **Header**: Prediction target and confidence percentage
2. **Base Probability**: Starting percentage for the prediction
3. **Pattern Matches**: Each pattern with lift multiplier and highlights
4. **Calculation Summary**: Visual representation of the probability math

### 4. Implementation Phases

**Phase 1 (Current)**: Basic visual with $why and $highlight
- Use existing API response structure
- Transform factors into readable format
- Display highlighted terms from patterns
- Show probability calculations

**Phase 2 (Future)**: Enhanced with _relate statistics
- Add pattern match counts (e.g., "89 of 92 cases")
- Include clickable patterns for drill-down
- Show historical invoice examples

### 5. Technical Approach

1. Minimal changes to existing code structure
2. Focus on CSS and presentation layer
3. Preserve all Aito.ai API data
4. Ensure screenshot-friendly design for marketing

## Success Criteria

The redesigned explanation should:

1. Be immediately understandable by non-technical executives
2. Convey trust and professionalism
3. Highlight the value of AI-powered invoice routing
4. Look impressive in marketing materials and demos
5. Maintain accuracy while improving accessibility