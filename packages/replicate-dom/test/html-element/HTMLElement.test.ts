import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Window } from 'happy-dom'
import type { HTMLElement, IDocument, IHTMLElement, IWindow } from 'happy-dom'
import { applyDomPatch, initPrimaryDom } from '../../src'
import type { DomClasses } from '../../src/primary/mutable-dom-props'

describe(' HTMLElement', () => {
  let window: IWindow
  let document: IDocument
  let element: IHTMLElement

  let replicaWindow: IWindow
  let replicaDocument: IDocument

  beforeEach(() => {
    window = new Window()
    document = window.document
    element = <IHTMLElement>document.createElement('div')

    replicaWindow = new Window()
    replicaDocument = replicaWindow.document

    initPrimaryDom({
      onMutation(message) {
        applyDomPatch(replicaDocument as unknown as Node, message)
      },
      root: window.document as unknown as Node,
      classes: window as unknown as DomClasses,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('object.prototype.toString', () => {
    it('returns `[object HTMLElement]`', () => {
      expect(Object.prototype.toString.call(element)).toBe('[object HTMLElement]')
    })
  })

  describe('get accessKey()', () => {
    it('returns "".', () => {
      const div = <IHTMLElement>document.createElement('div')
      expect(div.accessKey).toBe('')
    })
  })

  for (const property of [
    'offsetHeight',
    'offsetWidth',
    'offsetLeft',
    'offsetTop',
    'clientHeight',
    'clientWidth',
    'clientLeft',
    'clientTop',
  ]) {
    describe(`get ${property}()`, () => {
      it('returns "0".', () => {
        const div = document.createElement('div')
        // @ts-expect-error should have a value
        expect(div[property]).toBe(0)
      })
    })
  }

  describe('contentEditable', () => {
    it('returns "inherit".', () => {
      const div = <HTMLElement>document.createElement('div')
      expect(div.contentEditable).toBe('inherit')
    })
  })

  describe('isContentEditable', () => {
    it('returns "false".', () => {
      const div = <HTMLElement>document.createElement('div')
      expect(div.isContentEditable).toBe(false)
    })
  })

  describe('get tabIndex()', () => {
    it('returns the attribute "tabindex" as a number.', () => {
      const div = <HTMLElement>document.createElement('div')
      div.setAttribute('tabindex', '5')
      expect(div.tabIndex).toBe(5)
    })
  })

  describe('set tabIndex()', () => {
    it('sets the attribute "tabindex".', () => {
      const div = <HTMLElement>document.createElement('div')
      div.tabIndex = 5
      expect(div.getAttribute('tabindex')).toBe('5')
    })

    it('removes the attribute "tabindex" when set to "-1".', () => {
      const div = <HTMLElement>document.createElement('div')
      div.tabIndex = 5
      div.tabIndex = -1
      expect(div.getAttribute('tabindex')).toBe(null)
    })
  })

  describe('get innerText()', () => {
    it('returns the as the textContent property if element is not connected to document.', () => {
      const div = document.createElement('div')
      const script = document.createElement('script')
      const style = document.createElement('style')
      element.appendChild(div)
      element.appendChild(script)
      element.appendChild(style)
      element.appendChild(document.createTextNode('text2'))
      div.appendChild(document.createTextNode('text1'))
      script.appendChild(document.createTextNode('var key = "value";'))
      style.appendChild(document.createTextNode('button { background: red; }'))
      expect(element.innerText).toBe('text1var key = "value";button { background: red; }text2')
    })

    it('returns the as the textContent property without any line breaks if element is not connected to document.', () => {
      element.innerHTML = `<div>The <strong>quick</strong> brown fox</div><div>Jumped over the lazy dog</div>`
      expect(element.innerText).toBe('The quick brown foxJumped over the lazy dog')
    })

    it('returns rendered text with line breaks between block and flex elements and without hidden elements being rendered if element is connected to the document.', () => {
      document.body.appendChild(element)

      element.innerHTML = `<div>The <strong>quick</strong> brown fox</div><script>var key = "value";</script><style>button { background: red; }</style><div>Jumped over the lazy dog</div>`
      expect(element.innerText).toBe('The quick brown fox\nJumped over the lazy dog')

      element.innerHTML = `<div>The <strong>quick</strong> brown fox</div><span style="display: flex">Jumped over the lazy dog</span><div>.</div>`
      expect(element.innerText).toBe('The quick brown fox\nJumped over the lazy dog\n.')
    })

    it('returns rendered text affected by the "text-transform" CSS property.', () => {
      document.body.appendChild(element)

      element.innerHTML = `<div>The <strong>quick</strong> brown fox</div><span>Jumped over the lazy dog</span><style>span { text-transform: uppercase; display: block; }</style>`
      expect(element.innerText).toBe('The quick brown fox\nJUMPED OVER THE LAZY DOG')

      element.innerHTML = `<div>The <strong>quick</strong> brown fox</div><span>JUMPED OVER THE LAZY DOG</span><style>span { text-transform: lowercase; display: block; }</style>`
      expect(element.innerText).toBe('The quick brown fox\njumped over the lazy dog')

      element.innerHTML = `<div>The <strong>quick</strong> brown fox</div><span>jumped over the lazy dog</span><style>span { text-transform: capitalize; display: block; }</style>`
      expect(element.innerText).toBe('The quick brown fox\nJumped Over The Lazy Dog')
    })
  })

  describe('set innerText()', () => {
    it('sets the value of the textContent property.', () => {
      const div = document.createElement('div')
      const textNode1 = document.createTextNode('text1')
      const textNode2 = document.createTextNode('text2')

      element.appendChild(div)
      element.appendChild(textNode1)
      element.appendChild(textNode2)

      element.textContent = 'new_text'

      expect(element.innerText).toBe('new_text')
      expect(element.innerText).toBe(element.textContent)
      expect(element.childNodes.length).toBe(1)
      expect(element.childNodes[0]?.textContent).toBe('new_text')
    })
  })

  describe('get style()', () => {
    it('returns styles.', () => {
      element.setAttribute('style', 'border-radius: 2px; padding: 2px;')

      expect(element.style.length).toEqual(8)
      expect(element.style[0]).toEqual('border-top-left-radius')
      expect(element.style[1]).toEqual('border-top-right-radius')
      expect(element.style[2]).toEqual('border-bottom-right-radius')
      expect(element.style[3]).toEqual('border-bottom-left-radius')
      expect(element.style[4]).toEqual('padding-top')
      expect(element.style[5]).toEqual('padding-right')
      expect(element.style[6]).toEqual('padding-bottom')
      expect(element.style[7]).toEqual('padding-left')
      expect(element.style.borderRadius).toEqual('2px')
      expect(element.style.padding).toEqual('2px')
      expect(element.style.cssText).toEqual('border-radius: 2px; padding: 2px;')

      element.setAttribute('style', 'border-radius: 4px; padding: 4px;')

      expect(element.style.length).toEqual(8)
      expect(element.style[0]).toEqual('border-top-left-radius')
      expect(element.style[1]).toEqual('border-top-right-radius')
      expect(element.style[2]).toEqual('border-bottom-right-radius')
      expect(element.style[3]).toEqual('border-bottom-left-radius')
      expect(element.style[4]).toEqual('padding-top')
      expect(element.style[5]).toEqual('padding-right')
      expect(element.style[6]).toEqual('padding-bottom')
      expect(element.style[7]).toEqual('padding-left')

      expect(element.style.borderRadius).toEqual('4px')
      expect(element.style.padding).toEqual('4px')
      expect(element.style.cssText).toEqual('border-radius: 4px; padding: 4px;')
    })

    it('setting a property changes the "style" attribute.', () => {
      element.setAttribute('style', 'border-radius: 2px; padding: 2px;')

      element.style.borderRadius = '4rem'
      element.style.backgroundColor = 'green'

      expect(element.style.length).toEqual(9)
      expect(element.style[0]).toEqual('border-top-left-radius')
      expect(element.style[1]).toEqual('border-top-right-radius')
      expect(element.style[2]).toEqual('border-bottom-right-radius')
      expect(element.style[3]).toEqual('border-bottom-left-radius')
      expect(element.style[4]).toEqual('padding-top')
      expect(element.style[5]).toEqual('padding-right')
      expect(element.style[6]).toEqual('padding-bottom')
      expect(element.style[7]).toEqual('padding-left')
      expect(element.style[8]).toEqual('background-color')

      expect(element.style.borderRadius).toEqual('4rem')
      expect(element.style.padding).toEqual('2px')
      expect(element.style.backgroundColor).toEqual('green')

      expect(element.style.cssText).toEqual(
        'border-radius: 4rem; padding: 2px; background-color: green;',
      )

      expect(element.getAttribute('style')).toEqual(
        'border-radius: 4rem; padding: 2px; background-color: green;',
      )
    })

    it('settings a property to empty string also removes it.', () => {
      element.setAttribute('style', 'border-radius: 2px; padding: 2px;')

      element.style.borderRadius = ''
      element.style.backgroundColor = 'green'

      expect(element.style.length).toEqual(5)
      expect(element.style[0]).toEqual('padding-top')
      expect(element.style[1]).toEqual('padding-right')
      expect(element.style[2]).toEqual('padding-bottom')
      expect(element.style[3]).toEqual('padding-left')
      expect(element.style[4]).toEqual('background-color')
      expect(element.style[5]).toBe(undefined)

      expect(element.style.borderRadius).toEqual('')
      expect(element.style.padding).toEqual('2px')
      expect(element.style.backgroundColor).toEqual('green')

      expect(element.style.cssText).toEqual('padding: 2px; background-color: green;')

      expect(element.getAttribute('style')).toEqual('padding: 2px; background-color: green;')
    })
  })

  describe('set style()', () => {
    it('sets the value of the style.cssText property.', () => {
      element.style = 'border-radius: 2px; padding: 2px;'

      expect(element.style.cssText).toEqual('border-radius: 2px; padding: 2px;')
      expect(element.style.borderRadius).toEqual('2px')
      expect(element.style.padding).toEqual('2px')
      expect(element.getAttribute('style')).toEqual('border-radius: 2px; padding: 2px;')
      expect(element.outerHTML).toEqual('<div style="border-radius: 2px; padding: 2px;"></div>')

      element.style = ''

      expect(element.style.cssText).toEqual('')
      expect(element.style.borderRadius).toEqual('')
      expect(element.style.padding).toEqual('')
      expect(element.getAttribute('style')).toEqual('')
      expect(element.outerHTML).toEqual('<div style=""></div>')

      element.style = null

      expect(element.style.cssText).toEqual('')
      expect(element.style.borderRadius).toEqual('')
      expect(element.style.padding).toEqual('')
      expect(element.getAttribute('style')).toEqual('')
      expect(element.outerHTML).toEqual('<div style=""></div>')
    })
  })

  describe('get dataset()', () => {
    it('returns a Proxy behaving like an object that can add, remove, set and get element attributes prefixed with "data-".', () => {
      element.setAttribute('test-alpha', 'value1')
      element.setAttribute('data-test-alpha', 'value2')
      element.setAttribute('test-beta', 'value3')
      element.setAttribute('data-test-beta', 'value4')

      const dataset = element.dataset

      expect(dataset).toEqual(element.dataset)
      expect(Object.keys(dataset)).toEqual(['testAlpha', 'testBeta'])
      expect(Object.values(dataset)).toEqual(['value2', 'value4'])

      dataset.testGamma = 'value5'

      expect(element.getAttribute('data-test-gamma')).toBe('value5')
      expect(Object.keys(dataset)).toEqual(['testAlpha', 'testBeta', 'testGamma'])
      expect(Object.values(dataset)).toEqual(['value2', 'value4', 'value5'])

      element.setAttribute('data-test-delta', 'value6')

      expect(dataset.testDelta).toBe('value6')
      expect(Object.keys(dataset)).toEqual(['testAlpha', 'testBeta', 'testGamma', 'testDelta'])
      expect(Object.values(dataset)).toEqual(['value2', 'value4', 'value5', 'value6'])

      delete dataset.testDelta

      expect(element.getAttribute('data-test-delta')).toBe(null)
      expect(Object.keys(dataset)).toEqual(['testAlpha', 'testBeta', 'testGamma'])
      expect(Object.values(dataset)).toEqual(['value2', 'value4', 'value5'])

      delete dataset.nonExistentKey
    })

    // https://github.com/capricorn86/happy-dom/issues/493
    it('creates dataset from "innerHTML" markup.', () => {
      const main = document.createElement('main')
      main.innerHTML = `<button data-test="test"></button>`
      document.body.append(main)
      const button = <IHTMLElement>main.querySelector('button')
      expect(button.dataset.test).toBe('test')
    })

    // https://github.com/capricorn86/happy-dom/issues/493
    it('finds closest ancestor element by data attribute.', () => {
      const main = document.createElement('main')
      document.body.append(main)
      const div = <IHTMLElement>document.createElement('div')
      div.dataset.test = 'test'
      div.innerHTML = '<button>label</button>'
      main.append(div)
      const button = <IHTMLElement>main.querySelector('button')
      expect(button.closest('[data-test]')).toBe(div)
    })
  })

  describe('get dir()', () => {
    it('returns the attribute "dir".', () => {
      const div = <HTMLElement>document.createElement('div')
      div.setAttribute('dir', 'rtl')
      expect(div.dir).toBe('rtl')
    })
  })

  describe('set dir()', () => {
    it('sets the attribute "tabindex".', () => {
      const div = <HTMLElement>document.createElement('div')
      div.dir = 'rtl'
      expect(div.getAttribute('dir')).toBe('rtl')
    })
  })

  describe('get hidden()', () => {
    it('returns the attribute "hidden".', () => {
      const div = <HTMLElement>document.createElement('div')
      div.setAttribute('hidden', '')
      expect(div.hidden).toBe(true)
    })
  })

  describe('set hidden()', () => {
    it('sets the attribute "hidden".', () => {
      const div = <HTMLElement>document.createElement('div')
      div.hidden = true
      expect(div.getAttribute('hidden')).toBe('')
      div.hidden = false
      expect(div.getAttribute('hidden')).toBe(null)
    })
  })

  for (const property of ['lang', 'title']) {
    describe(`get ${property}`, () => {
      it(`returns the attribute "`, () => {
        const div = document.createElement('div')
        div.setAttribute(property, 'value')
        // @ts-expect-error should have a value
        expect(div[property]).toBe('value')
      })
    })

    describe(`set ${property}()`, () => {
      it(`sets the attribute "`, () => {
        const div = document.createElement('div')
        // @ts-expect-error should have a value
        div[property] = 'value'
        expect(div.getAttribute(property)).toBe('value')
      })
    })
  }

  describe('click()', () => {
    it('dispatches "click" event.', () => {
      let triggeredEvent: any = null

      element.addEventListener('click', event => (triggeredEvent = event))

      element.click()

      expect(triggeredEvent.type).toBe('click')
      expect(triggeredEvent.bubbles).toBe(true)
      expect(triggeredEvent.composed).toBe(true)
      expect(triggeredEvent.target === element).toBe(true)
      expect(triggeredEvent.currentTarget === element).toBe(true)
      expect(triggeredEvent.width).toBe(1)
      expect(triggeredEvent.height).toBe(1)
    })
  })

  describe('setAttributeNode()', () => {
    it('sets css text of existing CSSStyleDeclaration.', () => {
      element.style.background = 'green'
      element.style.color = 'black'
      element.setAttribute('style', 'color: green')
      expect(element.style.length).toEqual(1)
      expect(element.style[0]).toEqual('color')
      expect(element.style.color).toEqual('green')
    })
  })

  describe('removeAttributeNode()', () => {
    it('removes property from CSSStyleDeclaration.', () => {
      element.style.background = 'green'
      element.style.color = 'black'
      element.removeAttribute('style')
      expect(element.style.length).toEqual(0)
      expect(element.style.cssText).toEqual('')
    })
  })
})
