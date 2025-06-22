# UI Design System Guide

This document outlines the design system and visual identity established for the Aito.ai grocery store demo application.

## Design Philosophy

The application follows a modern, clean design approach inspired by contemporary e-commerce platforms (specifically K-Ruoka). The design emphasizes:

- **Consistency**: Unified color scheme and component styling across all pages
- **Accessibility**: Clear typography, proper contrast, and intuitive navigation
- **Professional Appeal**: Clean layouts that demonstrate enterprise-grade AI capabilities
- **Visual Hierarchy**: Strategic use of color and spacing to guide user attention

## Color Palette

### Primary Colors
- **Orange Accent**: `#FF6B35` (`--aito-accent`)
  - Used for: interactive elements, icons, highlights, call-to-action buttons
  - Hover state: `#e55a2b`
- **Red Branding**: `rgb(194, 6, 20)` (`--aito-red`)
  - Used for: search container background, brand elements
- **Grey Primary**: `#6c757d` (`--aito-primary`)
  - Used for: text, subtle UI elements

### Background Colors
- **White/Light Grey**: Primary background and card surfaces
- **Surface Grey**: `--aito-surface` for secondary backgrounds
- **Border Grey**: `--aito-border` for subtle separations

## Typography

### Font Hierarchy
- **Page Titles**: 2rem, font-weight 700
- **Section Titles**: 1.25rem, font-weight 600, orange underline accent
- **Body Text**: 0.9-1rem, varying weights based on importance
- **Labels**: 0.9rem, font-weight 600, capitalized

### Text Colors
- **Primary Text**: `--aito-text-primary` (dark grey/black)
- **Secondary Text**: `--aito-text-secondary` (lighter grey)
- **Interactive Text**: Orange accent for links and active states

## Component Design

### Navigation Bar
- **Logo**: Orange circular icon with "a" and "Acme" text
- **Icons**: Orange cart and person icons with consistent styling
- **Alignment**: Proper text baseline alignment between cart count and user name
- **Background**: Clean white with subtle shadows

### Search Component
- **Container**: Full-width red background extending beyond content area
- **Input Field**: White background with rounded corners
- **Search Icon**: Integrated into input field
- **Suggestions**: High z-index (9999) to overlay other components

### Product Cards
- **Layout**: 5-column responsive grid (adapts to 1 column on mobile)
- **Structure**: Vertical card layout with image, content, and action areas
- **Pricing**: Bold black text in bottom-left
- **Actions**: Orange cart-plus icon in bottom-right
- **Hover States**: Subtle shadow and border color changes

### Form Elements
- **Input Fields**: Clean borders with orange focus states
- **Labels**: Capitalized, consistent spacing
- **Dropdowns**: Orange styling matching accent theme
- **Buttons**: Orange background with hover animations

### Cards and Containers
- **Sections**: White background with subtle borders and shadows
- **Spacing**: Consistent use of CSS custom properties for margins/padding
- **Radius**: Standardized border-radius values
- **Elevation**: Layered shadow system for depth

## Page-Specific Implementations

### Landing Page
- **Search Bar**: Prominent red container with centered white input
- **Product Grid**: Card-based layout replacing horizontal list format
- **Recommendations**: Integrated seamlessly with main product display

### Invoice Page
- **Header Section**: Professional introduction with title and description
- **Two-Column Layout**: Input fields on left, AI predictions on right
- **Form Styling**: Consistent field labels and orange accent colors
- **Prediction Cards**: Clean display of AI results with orange question mark help icons
- **Dropdown Integration**: Orange-themed dropdowns matching overall design

## Responsive Design

### Breakpoints
- **Desktop**: Default 5-column grid, full-width containers
- **Tablet**: Responsive grid collapse, maintained spacing
- **Mobile**: Single-column layout, adjusted padding and margins

### Mobile Adaptations
- Grid layouts collapse to single columns
- Padding and spacing adjusted for smaller screens
- Touch-friendly button and icon sizing
- Maintained visual hierarchy and color scheme

## CSS Architecture

### Custom Properties (CSS Variables)
```css
--aito-primary: #6c757d
--aito-accent: #FF6B35
--aito-red: rgb(194, 6, 20)
--aito-spacing-xs: 0.25rem
--aito-spacing-sm: 0.5rem
--aito-spacing-md: 1rem
--aito-spacing-lg: 1.5rem
--aito-spacing-xl: 2rem
--aito-radius: 8px
--aito-radius-small: 4px
--aito-shadow: 0 2px 4px rgba(0,0,0,0.1)
--aito-shadow-hover: 0 4px 12px rgba(0,0,0,0.15)
```

### Component Naming Convention
- **BEM-style**: `.ComponentName__element--modifier`
- **Consistent Prefixes**: All custom components use descriptive prefixes
- **Semantic Classes**: Names reflect purpose rather than appearance

## Design Tokens

### Spacing System
- **Micro**: 4px (--aito-spacing-xs)
- **Small**: 8px (--aito-spacing-sm)
- **Medium**: 16px (--aito-spacing-md)
- **Large**: 24px (--aito-spacing-lg)
- **Extra Large**: 32px (--aito-spacing-xl)

### Animation & Transitions
- **Standard Duration**: 0.2s ease
- **Hover Effects**: Subtle transforms and shadow changes
- **Focus States**: Orange glow with proper accessibility contrast

## Implementation Guidelines

### Adding New Components
1. Follow established color palette and spacing system
2. Use CSS custom properties for consistent theming
3. Implement proper hover and focus states
4. Ensure mobile responsiveness
5. Maintain semantic class naming

### Styling Best Practices
- Leverage existing CSS variables
- Implement consistent border-radius and shadow systems
- Use orange accent sparingly for maximum impact
- Ensure proper contrast ratios for accessibility
- Test across different screen sizes

### Bootstrap Integration
- Override Bootstrap defaults with custom CSS
- Scope overrides to specific components when necessary
- Maintain Bootstrap grid system while customizing appearance
- Use custom classes to extend rather than replace Bootstrap components

## Future Considerations

### Scalability
- CSS custom properties allow easy theme modifications
- Component-based architecture supports new page additions
- Consistent naming conventions facilitate maintenance

### Accessibility
- Color contrast meets WCAG guidelines
- Focus states are clearly visible
- Interactive elements have appropriate sizing
- Semantic HTML structure supports screen readers

### Performance
- Minimal CSS overrides for faster loading
- Consistent spacing system reduces CSS bloat
- Efficient use of shadows and animations