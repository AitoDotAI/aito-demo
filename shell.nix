{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
   pkgs.nodejs
   pkgs.python310
   pkgs.docker-compose
   pkgs.postgresql
   pkgs.yarn
   pkgs.yarn2nix
   pkgs.nodePackages.npm
   pkgs.nodePackages.dotenv-cli
   pkgs.nodePackages.ts-node
  ];
}
