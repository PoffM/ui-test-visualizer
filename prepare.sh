set -e

# Install example app dependencies
(
  cd examples/react
  pnpm install
)

(
  cd node_modules/vitest-explorer
  # Install vitest-explorer dependencies using NPM because it directly imports transitive dependencies
  npm install
  # Compile vitest-explorer so this extension can import it
  npm run compile
)
