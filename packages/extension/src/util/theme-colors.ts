import * as path from 'node:path'
import * as vscode from 'vscode'

interface Theme {
  colors?: Record<string, string>
  tokenColors?: Array<{
    scope?: string | string[]
    settings?: { foreground?: string }
  }>
}

const defaultColor = 'var(--vscode-editor-foreground)'
const themeTokenColors = [
  'text', // For HTML text content
  'string', // For HTML attribute values
  'punctuation', // For HTML <>/= characters
  'entity.name.tag', // For HTML tags
  'entity.other.attribute-name', // For HTML attribute names
] as const

type ThemeTokenColor = (typeof themeTokenColors)[number]
type ThemeTokenColorMap = Partial<Record<ThemeTokenColor, string>>

/**
 * Finds the URI of the active color theme's definition file.
 * It searches through all extensions to find the one that contributes the current theme,
 * and then constructs the path to the theme's JSON file.
 */
function findThemeFileUri(): vscode.Uri | undefined {
  const currentTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme')

  for (const extension of vscode.extensions.all) {
    const theme = extension.packageJSON.contributes?.themes?.find((theme: any) => theme.label === currentTheme || theme.id === currentTheme)
    if (theme) {
      return vscode.Uri.file(path.join(extension.extensionPath, theme.path))
    }
  }
  return undefined
}

// Regular expression to find comments, but not inside strings.
// It handles single-line, multi-line, and trailing comments.
function stripJsonComments(jsonString: string): string {
  return jsonString.replace(
    /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
    (match, group) => (group ? '' : match),
  )
}

function normalizeThemeColors(theme: Theme): Record<string, string> {
  const colors = theme.colors || {}
  for (const tokenColor of theme.tokenColors || []) {
    if (tokenColor.scope && tokenColor.settings?.foreground) {
      const scopes = Array.isArray(tokenColor.scope) ? tokenColor.scope : [tokenColor.scope]

      for (const scope of scopes) {
        const combinedScopes = scope.split(',')
        for (const combinedScope of combinedScopes) {
          colors[combinedScope.trim()] = tokenColor.settings.foreground
        }
      }
    }
  }
  return colors
}

/**
 * Retrieves the current theme's syntax highlighting colors by parsing the theme file.
 */
export async function getThemeColors(): Promise<ThemeTokenColorMap> {
  const tokenColorMap: ThemeTokenColorMap = {}
  const themeFileUri = findThemeFileUri()
  if (!themeFileUri) { return tokenColorMap }

  const themeContent = await vscode.workspace.fs.readFile(themeFileUri)

  try {
    const theme = JSON.parse(stripJsonComments(themeContent.toString())) as Theme
    const colors = normalizeThemeColors(theme)
    for (const token of themeTokenColors) {
      const [bestMatch] = Object.keys(colors)
        .filter(k => k === token || k.endsWith(`.${token}`) || (k.includes(token) && k.includes('.html')))
        .sort((a, b) => a.length - b.length)
      tokenColorMap[token] = bestMatch && colors[bestMatch] || defaultColor
    }
  }
  catch (error) {
    console.error('Error parsing theme file', error)
  }
  return tokenColorMap as ThemeTokenColorMap
}
