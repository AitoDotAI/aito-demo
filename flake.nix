{
  description = "Aito Demo - AI-powered grocery store application";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        nodeDependencies = pkgs.stdenv.mkDerivation {
          name = "aito-demo-node-dependencies";
          src = ./.;
          buildInputs = [ pkgs.nodejs_18 ];
          
          buildPhase = ''
            export HOME=$TMPDIR
            npm ci --production
          '';
          
          installPhase = ''
            mkdir -p $out
            cp -r node_modules $out/
          '';
        };
      in
      {
        devShells.default = pkgs.mkShell {
          name = "aito-demo-dev";
          
          buildInputs = with pkgs; [
            # Node.js and package managers
            nodejs_18
            nodePackages.npm
            nodePackages.yarn
            nodePackages.pnpm
            
            # Development tools
            git
            curl
            jq
            ripgrep
            watchman
            
            # For testing and screenshots
            chromium
            playwright-driver.browsers
            
            # Docker for containerized deployment
            docker
            docker-compose
            
            # GitHub CLI for PR management
            gh
            
            # Code quality tools
            nodePackages.eslint
            nodePackages.prettier
            nodePackages.typescript-language-server
          ];
          
          shellHook = ''
            echo "🚀 Aito Demo Development Environment (Nix Flakes)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "Node.js: $(node --version) | npm: $(npm --version)"
            echo ""
            
            # Set up environment variables
            if [ -f .env ]; then
              set -a; source .env; set +a
              echo "✓ Loaded .env file"
            elif [ -f .env.example ]; then
              cp .env.example .env
              set -a; source .env; set +a
              echo "✓ Created .env from .env.example"
            fi
            
            # Check dependencies
            if [ ! -d "node_modules" ]; then
              echo "📦 Installing dependencies..."
              npm install
            fi
            
            echo ""
            echo "Quick commands:"
            echo "  nix develop       - Enter development shell"
            echo "  npm start         - Start dev server (port 3000)"
            echo "  npm run build     - Build production bundle"
            echo "  npm test          - Run test suite"
            echo "  npm run lint      - Run ESLint"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          '';
          
          NODE_ENV = "development";
          NODE_OPTIONS = "--max-old-space-size=4096";
          PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
        };
        
        packages.default = pkgs.stdenv.mkDerivation rec {
          pname = "aito-demo";
          version = "1.0.0";
          
          src = ./.;
          
          buildInputs = [ pkgs.nodejs_18 ];
          
          buildPhase = ''
            export HOME=$TMPDIR
            export NODE_ENV=production
            
            # Copy pre-built node_modules if available
            if [ -d "${nodeDependencies}/node_modules" ]; then
              cp -r ${nodeDependencies}/node_modules .
            else
              npm ci --production
            fi
            
            npm run build
          '';
          
          installPhase = ''
            mkdir -p $out/share/aito-demo
            cp -r build/* $out/share/aito-demo/
            
            # Create a simple wrapper script
            mkdir -p $out/bin
            cat > $out/bin/aito-demo-server <<EOF
            #!/bin/sh
            ${pkgs.nodejs_18}/bin/npx serve -s $out/share/aito-demo -l 3000
            EOF
            chmod +x $out/bin/aito-demo-server
          '';
          
          meta = with pkgs.lib; {
            description = "AI-powered grocery store demo application";
            homepage = "https://github.com/AitoDotAI/aito-demo";
            license = licenses.asl20;
            maintainers = [ ];
            platforms = platforms.all;
          };
        };
        
        apps.default = flake-utils.lib.mkApp {
          drv = self.packages.${system}.default;
          exePath = "/bin/aito-demo-server";
        };
      }
    );
}