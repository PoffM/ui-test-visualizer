import { beforeEach, describe, expect, it } from 'vitest'
import type { DOMWindow } from 'jsdom'
import { JSDOM } from 'jsdom'
import { initTestReplicaDom } from '../test-setup'
import { serializeDomNode } from '../../src'

let window: DOMWindow
let document: Document

let replicaWindow: DOMWindow
let replicaDocument: Document

let customElementOutput: any

beforeEach(() => {
  window = new JSDOM().window
  document = window.document

  replicaWindow = new JSDOM().window
  replicaDocument = replicaWindow.document

  initTestReplicaDom(window as unknown as Window, replicaWindow as unknown as Window)

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
      this.shadowRoot!.innerHTML = '<div><span>Test</span></div>';
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

    const primarySerialized = serializeDomNode(document.body, window as unknown as typeof globalThis['window'])
    const replicaSerialized = serializeDomNode(replicaDocument.body, replicaWindow as unknown as typeof globalThis['window'])

    expect(replicaSerialized).toEqual(primarySerialized)
  })

  it('calls connected callback which mutates other DOM nodes.', () => {
    document.body.innerHTML = `
      <div id="outer">
        <div id="text">Hello</div>
        <div id="example-wrapper"></div>
      </div>`

    const textDiv1 = document.createElement('div')
    textDiv1.textContent = 'Initial text 1'
    document.querySelector('#outer')!.appendChild(textDiv1)

    const textDiv2 = document.createElement('div')
    textDiv2.textContent = 'Initial text 2'
    document.querySelector('#outer')!.appendChild(textDiv2)

    class ExampleElement extends window.HTMLElement {
      constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        textDiv1.textContent = 'Mutated by ExampleElement\'s constructor'
      }

      public connectedCallback(): void {
        this.shadowRoot!.innerHTML = '<span id="shadow-inner">Shadow Text</span>'
        this.innerHTML = '<span id="element-inner">Inner Text</span>'
        textDiv2.textContent = 'Mutated by ExampleElement\'s connectedCallback'
      }
    }
    window.customElements.define('example-element', ExampleElement)

    document.querySelector('#example-wrapper')!.innerHTML = '<example-element></example-element>'

    const primarySerialized = serializeDomNode(document.body, window as unknown as typeof globalThis['window'])
    const replicaSerialized = serializeDomNode(replicaDocument.body, replicaWindow as unknown as typeof globalThis['window'])

    expect(replicaSerialized).toEqual(primarySerialized)
  })
})
