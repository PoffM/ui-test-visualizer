set -e

# Install vitest-explorer's dependencies
(
  cd node_modules/vitest-explorer
  # Use yarn to install with its yarn lockfile
  pnpm exec yarn install --frozen-lockfile
)

# Install vscode-jest-runner's dependencies
(
  cd node_modules/vscode-jest-runner
  # Use npm to install with its npm lockfile
  npm install
)
