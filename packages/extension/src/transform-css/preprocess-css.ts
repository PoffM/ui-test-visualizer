import { pathToFileURL } from 'node:url'
import path from 'pathe'

const sassMod = () => import('sass')
const lessMod = () => import('less')
const stylusMod = () => import('stylus')

type Sass = Awaited<ReturnType<typeof sassMod>>
type Less = Awaited<ReturnType<typeof lessMod>>
type Stylus = Awaited<ReturnType<typeof stylusMod>>

function stripQueryAndHash(filename: string): string {
  const queryIndex = filename.indexOf('?')
  const hashIndex = filename.indexOf('#')
  const endIndex
    = queryIndex === -1
      ? (hashIndex === -1 ? filename.length : hashIndex)
      : (hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex))
  return filename.slice(0, endIndex)
}

async function tryImport<T>(moduleName: string): Promise<T | undefined> {
  try {
    // Runtime require so the dependency is provided externally at runtime
    const importPath = require.resolve(moduleName, { paths: [process.cwd()] })
    // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports
    const mod = require(importPath)
    // Support CJS and ESM default interop
    return mod?.default ?? mod
  }
  catch (error) {
    // If the module is not found, return undefined so a fallback can be tried
    return undefined
  }
}

function getExt(filename: string): string {
  return path.extname(stripQueryAndHash(filename)).toLowerCase()
}

export async function preprocessCss(
  code: string,
  filename: string,
): Promise<string> {
  const ext = getExt(filename)
  if (ext === '.scss' || ext === '.sass') {
    return await processSass(code, filename, ext === '.sass')
  }
  if (ext === '.less') {
    return await processLess(code, filename)
  }
  if (ext === '.styl' || ext === '.stylus') {
    return await processStylus(code, filename)
  }
  // Not a recognized preprocessor; return as-is
  return code
}

async function processSass(
  source: string,
  filename: string,
  isIndentedSyntax: boolean,
): Promise<string> {
  const sass = ((await tryImport<Sass>('sass-embedded')) || (await tryImport<Sass>('sass')))
  if (!sass) {
    throw new Error(
      'Preprocessor dependency "sass" not found. Install either "sass-embedded" or "sass".',
    )
  }

  // Prefer compileStringAsync if available (dart-sass and sass-embedded)
  if (typeof sass.compileStringAsync === 'function') {
    const result = await sass.compileStringAsync(source, {
      url: pathToFileURL(filename),
      syntax: isIndentedSyntax ? 'indented' : 'scss',
      sourceMap: false,
    })
    return result.css
  }

  // Fallback to legacy er API if present
  if (typeof sass.render === 'function') {
    const result = await new Promise<string>((resolve, reject) => {
      sass.render(
        {
          data: source,
          file: filename,
          indentedSyntax: isIndentedSyntax,
          sourceMap: false,
        },
        (err: unknown, res) => {
          if (err || !res?.css) { reject(err) }
          else { resolve(res.css.toString()) }
        },
      )
    })
    return result
  }

  throw new Error('Unsupported "sass" API: expected compileStringAsync or render')
}

async function processLess(
  source: string,
  filename: string,
): Promise<string> {
  const less = await tryImport<Less>('less')
  if (!less) {
    throw new Error('Preprocessor dependency "less" not found. Install "less".')
  }
  const result = await less.render(source, {
    filename,
    javascriptEnabled: true,
  })
  return result.css
}

async function processStylus(
  source: string,
  filename: string,
): Promise<string> {
  const stylusModule = await tryImport<Stylus>('stylus')
  if (!stylusModule) {
    throw new Error('Preprocessor dependency "stylus" not found. Install "stylus".')
  }
  const stylusFactory = stylusModule as unknown as Stylus['default']
  const ref = stylusFactory(source)
  ref.set('filename', filename)
  const css = await new Promise<string>((resolve, reject) => {
    ref.render((err, out) => {
      if (err) { reject(err) }
      else { resolve(out) }
    })
  })
  return css
}
