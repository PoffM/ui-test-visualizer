set -e

(
  cd examples/react
  pnpm install
)

(
  cd node_modules/vitest-explorer
  npm install
  npm run compile
)
