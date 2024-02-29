import { beforeEach, describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { initTestReplicaDom } from '../test-setup'

let window: any
let document: any

let replicaWindow: any
let replicaDocument: any

beforeEach(() => {
  window = new JSDOM('', { runScripts: 'dangerously' }).window
  document = window.document

  replicaWindow = new JSDOM('', { runScripts: 'dangerously' }).window
  replicaDocument = replicaWindow.document

  initTestReplicaDom(window, replicaWindow)
})

describe('connectedCallback()', () => {
  it('runs a script and replicates any mutatuins that happen', () => {
    document.body.innerHTML = `
      <div>
        <div id="text"></div>
      </div>
    `

    const element = document.createElement('script')
    element.text = `document.querySelector('#text').textContent = 'Hello';`
    document.body.appendChild(element)

    expect(document.querySelector('#text').textContent).toBe('Hello')
    expect(replicaDocument.querySelector('#text').textContent).toBe('Hello')
  })
})
