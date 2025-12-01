{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  name = "aito-demo-dev";
  
  buildInputs = with pkgs; [
    # Node.js and package managers
    nodejs_20
    nodePackages.npm
    nodePackages.yarn
    nodePackages.pnpm
    
    # Development tools
    git
    curl
    jq
    ripgrep
    
    # For running scripts
    bash
    
    # For testing and screenshots
    chromium
    
    # Docker for containerized deployment
    docker
    docker-compose
    
    # GitHub CLI for PR management
    gh
    
    # Process management
    watchman
    
    # Code quality tools
    nodePackages.eslint
    nodePackages.prettier
  ];
  
  shellHook = ''
    echo "🚀 Aito Demo Development Environment"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Node.js version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo ""
    
    # Set up environment variables if .env exists
    if [ -f .env ]; then
      echo "Loading environment variables from .env"
      set -a
      source .env
      set +a
    elif [ -f .env.example ]; then
      echo "⚠️  No .env file found. Creating from .env.example..."
      cp .env.example .env
      echo "✅ Created .env file from .env.example"
      set -a
      source .env
      set +a
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
      echo ""
      echo "📦 No node_modules found. Run 'npm install' to install dependencies."
    else
      echo "✓ node_modules found"
    fi
    
    echo ""
    echo "Available commands:"
    echo "  npm start          - Start development server"
    echo "  npm run build      - Build for production"
    echo "  npm test          - Run tests"
    echo "  npm run lint      - Check code quality"
    echo "  npm run format    - Format code with Prettier"
    echo ""
    echo "Aito.ai Database URL: ''${REACT_APP_AITO_URL:-Not set}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  '';
  
  # Set NODE_ENV for development
  NODE_ENV = "development";
  
  # Increase Node.js memory limit for builds
  NODE_OPTIONS = "--max-old-space-size=4096";
  
  # Set Chromium path for Playwright tests
  CHROMIUM_PATH = "${pkgs.chromium}/bin/chromium";
}