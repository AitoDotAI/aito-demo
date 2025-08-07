# Product Page Redesign Plan

## Current State Analysis

The current Product page (`ProductPage.js`) displays detailed analytics for individual products but lacks design consistency with the updated landing and invoice pages. Key issues:

- Uses inline styles instead of design system components
- No proper header section or page structure
- Charts and data presentation need visual hierarchy
- Navigation buttons lack proper styling
- Missing consistent spacing and typography
- No card-based layout for content sections

## Design Goals

Following the established design system, transform the Product page into a professional analytics dashboard that:
- Maintains orange accent theme and consistent styling
- Provides clear visual hierarchy for data presentation
- Uses card-based layout for content organization
- Implements responsive design patterns
- Showcases AI-powered product analytics effectively

## Implementation Plan

### Phase 1: Page Structure & Header
**Objective**: Apply consistent page layout and professional header

**Tasks**:
1. Create `ProductPage.css` with design system imports
2. Add page container with max-width and padding
3. Implement header section with:
   - Page title: "Product Analytics"
   - Subtitle explaining AI-powered insights
   - Navigation controls (Prev/Next) with orange button styling

**Components**:
```css
.ProductPage {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--aito-spacing-lg);
}

.ProductPage__header {
  background-color: var(--aito-background);
  padding: var(--aito-spacing-xl);
  border-radius: var(--aito-radius);
  margin-bottom: var(--aito-spacing-xl);
}
```

### Phase 2: Product Information Card
**Objective**: Create visually appealing product overview section

**Design**:
- Two-column layout: product details (left) and image (right)
- Card-based container with shadow and borders
- Proper typography hierarchy for name, category, tags
- Enhanced product image presentation

**Features**:
- Product name as prominent heading
- Tags displayed as styled chips/badges
- Category and metadata in organized layout
- High-quality product image with fallback

### Phase 3: Analytics Dashboard Layout
**Objective**: Transform data presentation into professional dashboard

**Structure**:
1. **KPI Cards Row**: Impressions, Purchases, CTR in separate cards
2. **Performance Chart Card**: Time-series visualization
3. **Insights Grid**: 2x2 grid for different analytics sections

**Card Types**:
- **Metric Cards**: Clean number display with labels
- **Chart Card**: Recharts integration with proper theming
- **List Cards**: Organized data with proper formatting

### Phase 4: Data Visualization Enhancement
**Objective**: Improve charts and data presentation

**Chart Improvements**:
- Apply orange accent colors to chart elements
- Add proper legends and tooltips
- Responsive chart sizing
- Clean axis styling

**Data Lists**:
- Replace basic `<ol>` with styled components
- Add visual indicators for lift values
- Color-coded positive/negative impacts
- Hover states and interactive elements

### Phase 5: Navigation & Controls
**Objective**: Enhance product navigation experience

**Features**:
- Orange-styled Prev/Next buttons
- Product counter/indicator
- Smooth transitions between products
- Loading states during data fetching

## Detailed Component Specifications

### 1. Header Section
```jsx
<div className="ProductPage__header">
  <h1 className="ProductPage__title">Product Analytics</h1>
  <p className="ProductPage__subtitle">
    AI-powered insights and performance metrics for individual products
  </p>
  <div className="ProductPage__navigation">
    <button className="Button Button--secondary" onClick={prev}>← Previous</button>
    <span className="ProductPage__counter">{current + 1} of {total}</span>
    <button className="Button" onClick={next}>Next →</button>
  </div>
</div>
```

### 2. Product Overview Card
```jsx
<div className="ProductCard">
  <div className="ProductCard__content">
    <h2 className="ProductCard__name">{product.name}</h2>
    <div className="ProductCard__tags">
      {tags.map(tag => <span className="Tag">{tag}</span>)}
    </div>
    <div className="ProductCard__meta">
      <span className="ProductCard__category">{category}</span>
    </div>
  </div>
  <div className="ProductCard__image">
    <img src={imageUrl} alt={product.name} />
  </div>
</div>
```

### 3. KPI Metrics Row
```jsx
<div className="MetricsRow">
  <div className="MetricCard">
    <div className="MetricCard__value">{stats.count}</div>
    <div className="MetricCard__label">Impressions</div>
  </div>
  <div className="MetricCard MetricCard--highlight">
    <div className="MetricCard__value">{stats.sum}</div>
    <div className="MetricCard__label">Purchases</div>
  </div>
  <div className="MetricCard">
    <div className="MetricCard__value">{(stats.mean * 100).toFixed(1)}%</div>
    <div className="MetricCard__label">CTR</div>
  </div>
</div>
```

### 4. Analytics Grid
```jsx
<div className="AnalyticsGrid">
  <div className="AnalyticsCard">
    <h3 className="AnalyticsCard__title">Performance Trends</h3>
    <LineChart /> {/* Orange-themed */}
  </div>
  <div className="AnalyticsCard">
    <h3 className="AnalyticsCard__title">Product Properties Impact</h3>
    <InsightsList data={propertyInsights} />
  </div>
  <div className="AnalyticsCard">
    <h3 className="AnalyticsCard__title">Customer Segments</h3>
    <InsightsList data={segmentInsights} />
  </div>
  <div className="AnalyticsCard">
    <h3 className="AnalyticsCard__title">Basket Analysis</h3>
    <InsightsList data={basketInsights} />
  </div>
</div>
```

## CSS Architecture

### Color Scheme Application
- **Primary Actions**: Orange buttons for navigation
- **Data Highlights**: Orange accents for positive metrics
- **Chart Colors**: Orange primary with complementary grays
- **Cards**: White backgrounds with subtle shadows

### Responsive Breakpoints
- **Desktop**: 4-column analytics grid, side-by-side layouts
- **Tablet**: 2-column grid, stacked components
- **Mobile**: Single column, adjusted spacing

### Animation & Interactions
- **Smooth Transitions**: Between product changes
- **Hover States**: Card elevation and button highlights
- **Loading States**: Skeleton screens during data fetch

## Implementation Priority

1. **High Priority**: Page structure, header, product card
2. **Medium Priority**: KPI metrics, basic styling
3. **Low Priority**: Advanced interactions, animations

## Success Metrics

- **Visual Consistency**: Matches landing/invoice page styling
- **User Experience**: Clear navigation and data presentation
- **Performance**: Smooth transitions and responsive design
- **Accessibility**: Proper contrast and semantic structure

## Technical Considerations

### Dependencies
- Maintain existing Recharts integration
- Use design system CSS variables
- Preserve all current functionality
- Add proper error handling and loading states

### File Structure
- Update `ProductPage.css` with new styling
- Maintain `ProductPage.js` component structure
- Add reusable sub-components if needed
- Follow BEM naming conventions

This redesign will transform the Product page from a functional but unstyled component into a professional analytics dashboard that seamlessly integrates with the established design system.