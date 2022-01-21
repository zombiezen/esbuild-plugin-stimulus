{ pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/f3d9d4bd898cca7d04af2ae4f6ef01f2219df3d6.tar.gz") {}
}:

with pkgs;

mkShell {
  packages = [ jq nodejs-14_x ];
}
