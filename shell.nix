{
  pkgs ? import <nixpkgs> {},
  unstable ? import <nixos-unstable> { inherit (pkgs) system; config.allowUnfree = true; }
}:

pkgs.mkShell {
  buildInputs = [
   pkgs.vscode
   pkgs.nodejs_20
   pkgs.python310
   pkgs.docker-compose
   pkgs.postgresql
   pkgs.yarn
   pkgs.yarn2nix
   pkgs.nodePackages.npm
   pkgs.nodePackages.dotenv-cli
   pkgs.nodePackages.ts-node

   # Text editors and IDEs
   pkgs.vim
   pkgs.neovim
   pkgs.vscode

   # Development utilities
   pkgs.curl
   pkgs.wget
   pkgs.jq
   pkgs.tree
   pkgs.ripgrep
   pkgs.fd
   pkgs.bat
   pkgs.fzf

   # Programming language tools
   pkgs.python3
   pkgs.rustc
   pkgs.cargo
   pkgs.go

   # Container and deployment tools
   pkgs.docker
   pkgs.docker-compose

   # Documentation and markdown
   pkgs.pandoc

   # Network utilities
   pkgs.netcat
   pkgs.nmap

   # Build tools
   pkgs.gnumake
   pkgs.cmake

   # Shell utilities
   pkgs.zsh
   pkgs.fish
   pkgs.starship

   unstable.windsurf
   unstable.claude-code

  ];
}
