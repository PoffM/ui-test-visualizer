set -e

# Install vitest-explorer's dependencies
(
  cd node_modules/vitest-explorer
  # Use yarn to install with its yarn lockfile
  pnpm exec yarn install
  # Compile vitest-explorer so this extension can import it
  pnpm run compile
)
