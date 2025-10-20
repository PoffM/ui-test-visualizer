/* @refresh reload */

import * as webviewToolkit from '@vscode/webview-ui-toolkit'
import { render } from 'solid-js/web'
import { App } from './App'

import './index.css'

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
{
  const prefix = 'ui-test-visualizer'
  webviewToolkit
    .provideVSCodeDesignSystem()
    .register(webviewToolkit.vsCodeButton({ prefix }))
    .register(webviewToolkit.vsCodeCheckbox({ prefix }))
    .register(webviewToolkit.vsCodeProgressRing({ prefix }))
    .register(webviewToolkit.vsCodeTextField({ prefix }))
    .register(webviewToolkit.vsCodeRadio({ prefix }))
}

const root = document.getElementById('root')

render(() => <App />, root!)
