import { beforeEach, describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { initTestReplicaDom } from '../test-setup'
import { serializeDomNode } from '../../src'

let window: any
let document: any

let replicaWindow: any
let replicaDocument: any

let customElementOutput: any

beforeEach(() => {
  window = new JSDOM().window
  document = window.document

  replicaWindow = new JSDOM().window
  replicaDocument = replicaWindow.document

  initTestReplicaDom(window, replicaWindow)

  class CustomCounterElement extends window.HTMLElement {
    public static output: string[] = []

    /**
     * Constructor.
     */
    constructor() {
      super()
      this.attachShadow({ mode: 'open' })
    }

    /**
     * Connected.
     */
    public connectedCallback(): void {
      (this.shadowRoot).innerHTML = '<div><span>Test</span></div>';
      (<typeof CustomCounterElement> this.constructor).output.push('Counter:connected')
    }

    /**
     * Disconnected.
     */
    public disconnectedCallback(): void {
      (<typeof CustomCounterElement> this.constructor).output.push('Counter:disconnected')
    }
  }

  class CustomButtonElement extends window.HTMLElement {
    public static output: string[] = []

    /**
     * Connected.
     */
    public connectedCallback(): void {
      (<typeof CustomButtonElement> this.constructor).output.push('Button:connected')
    }

    /**
     * Disconnected.
     */
    public disconnectedCallback(): void {
      (<typeof CustomButtonElement> this.constructor).output.push('Button:disconnected')
    }
  }

  customElementOutput = []
  CustomCounterElement.output = customElementOutput
  CustomButtonElement.output = customElementOutput
  window.customElements.define('custom-counter', CustomCounterElement)
  window.customElements.define('custom-button', CustomButtonElement)
})

describe('connectedCallback()', () => {
  it('calls connected callback when a custom element is connected to DOM.', () => {
    document.body.innerHTML = '<custom-counter><custom-button></custom-button></custom-counter>'

    expect(customElementOutput).toEqual([
      'Counter:connected',
      'Button:connected',
    ])

    const primarySerialized = serializeDomNode(document.body, window)
    const replicaSerialized = serializeDomNode(replicaDocument.body, replicaWindow)

    expect(replicaSerialized).toEqual(primarySerialized)
  })
})
