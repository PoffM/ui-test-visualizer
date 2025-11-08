import { transformAsync } from '@babel/core'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

// @ts-expect-error no types
import solid from 'babel-preset-solid'
// @ts-expect-error no types
import ts from '@babel/preset-typescript'

GlobalRegistrator.register()

await Bun.plugin({
  name: 'bun-plugin-solid',
  setup: (build) => {
    build.onLoad({ filter: /\.(js|ts)x$/ }, async (args) => {
      const code = await Bun.file(args.path).text()
      const transforms = await transformAsync(code, {
        filename: args.path,
        presets: [
          [solid, { generate: 'dom', debug: true }],
          [ts, {}],
        ],
        retainLines: true,
      })

      return {
        contents: transforms!.code!,
        loader: 'js',
      }
    })
  },
})
