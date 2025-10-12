// This file should be passed to the Bun CLI's `--preload` argument.

import preTest from './test-runtime-setup'

await preTest()
