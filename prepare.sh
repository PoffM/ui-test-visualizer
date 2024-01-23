set -e

# Install vscode-jest-runner's dependencies
(
  cd node_modules/vscode-jest-runner
  # Use npm to install with its npm lockfile
  npm install
)
