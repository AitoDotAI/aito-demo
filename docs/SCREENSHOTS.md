# Screenshot Generation Guide

This document explains how to generate professional screenshots for the Aito Grocery Store Demo, especially on systems like NixOS where Playwright dependencies may not be available.

## 🐳 Docker-Based Screenshot Generation (Recommended for NixOS)

The Docker approach solves dependency issues by providing a clean Ubuntu environment with all necessary browser dependencies.

### Quick Start

```bash
# Generate all screenshots
./scripts/docker-screenshots.sh

# Generate specific categories
./scripts/docker-screenshots.sh marketing
./scripts/docker-screenshots.sh tutorials
./scripts/docker-screenshots.sh docs
```

### Prerequisites

- **Docker**: Install from [docker.com](https://docs.docker.com/get-docker/)
- **Sufficient disk space**: ~2GB for Docker image and dependencies

### How It Works

1. **Builds Ubuntu-based Docker image** with Node.js 20 and Playwright
2. **Installs all browser dependencies** automatically
3. **Mounts local filesystem** for screenshot output
4. **Starts development server** inside container
5. **Generates screenshots** using Playwright
6. **Saves results** to local `docs/screenshots/` directory

### Available Commands

```bash
# All screenshots (27 different views)
./scripts/docker-screenshots.sh all

# Marketing materials (high-res, landing pages)
./scripts/docker-screenshots.sh marketing

# Tutorial documentation (step-by-step guides)  
./scripts/docker-screenshots.sh tutorials

# Technical documentation (admin interfaces)
./scripts/docker-screenshots.sh docs

# Placeholder SVG screenshots
./scripts/docker-screenshots.sh placeholders

# Run Playwright test suite
./scripts/docker-screenshots.sh test

# Show help
./scripts/docker-screenshots.sh help
```

### Troubleshooting Docker Approach

**Docker not found:**
```bash
# Install Docker on NixOS
nix-env -iA nixpkgs.docker
# Or add to configuration.nix:
# virtualisation.docker.enable = true;
```

**Permission denied:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

**Port 3000 in use:**
```bash
# Find and kill process using port 3000
sudo lsof -ti:3000 | xargs kill -9
```

**Screenshots not generated:**
- Check `docs/screenshots/` directory permissions
- Ensure Docker has access to mount the directory
- Check Docker logs for errors

## 🖥️ Native Screenshot Generation

For systems with proper browser support (Ubuntu, macOS, Windows):

### Prerequisites

```bash
# Install system dependencies (Ubuntu/Debian)
npx playwright install-deps

# Install Playwright browsers
npx playwright install
```

### Commands

```bash
# Start development server (in one terminal)
npm start

# Generate screenshots (in another terminal)
npm run screenshots:all
npm run screenshots:marketing
npm run screenshots:tutorials
npm run screenshots:docs

# Using scripts directly
node scripts/screenshot-all-features.js
node scripts/screenshot-generator.js
```

## 📸 What Gets Generated

### Core Features (27 screenshots)
- **Smart Search**: Personalized results for each user persona
- **AI Assistants**: Shopping and admin chat interfaces  
- **Recommendations**: Dynamic product suggestions
- **Analytics**: Dashboard views and business intelligence
- **Invoice Processing**: Document automation workflows
- **Mobile Views**: Responsive design demonstrations

### Directory Structure
```
docs/screenshots/
├── features/           # Main functionality (27 files)
├── marketing/          # High-resolution materials
├── tutorials/          # Step-by-step guides
└── documentation/      # Technical screenshots
```

### File Formats
- **Production**: PNG files (1280x720 desktop, 375x667 mobile)
- **Placeholders**: SVG files with descriptions
- **High-res**: 1920x1080 for marketing materials

## 🔧 Configuration

### Environment Variables
```bash
# Required for actual screenshots
REACT_APP_AITO_URL=https://demo.aito.app
REACT_APP_AITO_API_KEY=demo-key

# Optional for AI assistants  
REACT_APP_OPENAI_API_KEY=your-key
```

### Viewport Sizes
- **Desktop**: 1280x720 (standard)
- **Mobile**: 375x667 (iPhone-like)
- **Tablet**: 768x1024 (iPad-like)  
- **High-res**: 1920x1080 (marketing)

### User Personas
Screenshots are generated for all three user personas:
- **Larry**: Lactose-intolerant preferences
- **Veronica**: Health-conscious choices
- **Alice**: General shopping patterns

## 🚀 Integration

### In Documentation
Screenshots are automatically referenced in:
- `README.md` - Feature demonstrations
- `docs/tutorials/getting-started.md` - Step-by-step guides
- `docs/blog-post.md` - Technical explanations
- `docs/tutorials/assistant-integration.md` - AI assistant examples

### In Marketing
- Landing page showcases
- Feature comparison charts
- Mobile app demonstrations
- Business intelligence examples

### Updating Screenshots
After UI changes, regenerate with:
```bash
# Docker approach (recommended)
./scripts/docker-screenshots.sh all

# Native approach
npm run screenshots:all
```

## 🛠️ Advanced Usage

### Custom Screenshot Script
```javascript
// Add to scripts/screenshot-all-features.js
await takeScreenshot(page, 'custom-feature', {
  directory: 'features',
  fullPage: true,
  clip: { x: 0, y: 0, width: 1280, height: 600 }
});
```

### Batch Operations
```bash
# Generate multiple types
for type in marketing tutorials docs; do
  ./scripts/docker-screenshots.sh $type
done
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Generate Screenshots
  run: |
    docker build -f Dockerfile.screenshots -t aito-screenshots .
    docker run --rm -v $PWD/docs/screenshots:/app/docs/screenshots aito-screenshots
```

## 📊 Performance

### Generation Times
- **All screenshots**: ~5-8 minutes (Docker)
- **Marketing only**: ~2-3 minutes
- **Single category**: ~1-2 minutes

### Resource Usage
- **Docker image**: ~1.5GB
- **Generated files**: ~50-100MB
- **Memory**: ~2GB during generation

## 🔍 Quality Assurance

### Verification Checklist
- [ ] All 27 screenshots generated
- [ ] No blank or error screenshots
- [ ] Consistent branding and styling
- [ ] Proper user persona differentiation
- [ ] Mobile responsiveness shown
- [ ] AI assistant interactions captured

### Manual Review
1. Check `docs/screenshots/features/` for completeness
2. Verify file sizes (should be 100-500KB each)
3. Review visual quality and clarity
4. Ensure proper user context in personalized views

---

For support with screenshot generation, see the troubleshooting sections above or check the main project documentation.