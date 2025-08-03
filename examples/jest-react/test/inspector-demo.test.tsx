import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { Counter } from '../components/Counter'

/// A kitchen sink type of test to test the inspector UI

it('demo', () => {
  render(<Counter />)

  // === Step 1: Copy counter UI into a Shadow DOM with title "Shadow Counter"
  const shadowHost = document.createElement('div')
  shadowHost.setAttribute('data-testid', 'shadow-host')
  document.body.appendChild(shadowHost)
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' })

  const shadowContainer = document.createElement('div')
  shadowRoot.appendChild(shadowContainer)

  // Clone Counter UI
  const shadowCounter = document.createElement('div')
  shadowCounter.innerHTML = `
    <h1>Shadow Counter</h1>
    <p data-count="0" data-testid="shadow-count-text">Count: 0</p>
    <button id="inc">Increment</button>
    <button id="dec">Decrement</button>
  `
  shadowContainer.appendChild(shadowCounter)

  // === Step 2: Nested Shadow DOM with "Nested Shadow Counter"
  const nestedHost = document.createElement('div')
  shadowContainer.appendChild(nestedHost)
  const nestedShadow = nestedHost.attachShadow({ mode: 'open' })

  const nestedCounter = document.createElement('div')
  nestedCounter.innerHTML = `
    <h1>Nested Shadow Counter</h1>
    <p data-count="0" data-testid="nested-shadow-count-text">Count: 0</p>
    <button id="nested-inc">Increment</button>
    <button id="nested-dec">Decrement</button>
  `
  nestedShadow.appendChild(nestedCounter)

  // === Step 3: Create 100 divs with data-testid="1" through "100"
  let container = document.body
  for (let i = 1; i <= 100; i++) {
    const div = document.createElement('div')
    div.setAttribute('data-testid', `${i}`)
    container.appendChild(div)
    container = div
  }

  // === Step 4: Increment twice, decrement once
  fireEvent.click(screen.getByText('Increment'))
  fireEvent.click(screen.getByText('Increment'))
  fireEvent.click(screen.getByText('Decrement'))

  // === Step 5: Modify the first h1 title's text and append text nodes
  const h1 = screen.getByRole('heading', { level: 1 })
  h1.textContent = 'Modified Title'
  h1.appendChild(document.createTextNode(' - Extra Text 1'))
  h1.appendChild(document.createTextNode(' - Extra Text 2'))

  // === Step 6: Add long text
  const longText = document.createTextNode('Long text '.repeat(100))
  const longTextDiv = document.createElement('div')
  longTextDiv.appendChild(longText)
  document.body.appendChild(longTextDiv)

  // === Step 7: Add many attributes to the same element
  const attrsDiv = document.createElement('div')
  attrsDiv.textContent = 'Many attributes on this div'
  for (let i = 0; i < 100; i++) {
    const attr = document.createAttribute(`data-attr-${i}`)
    attr.value = `value-${i}`
    attrsDiv.setAttributeNode(attr)
  }
  document.body.appendChild(attrsDiv)
  attrsDiv.appendChild(document.createElement('div'))

  // === Assertion (optional, to ensure state is correct)
  expect(screen.getByTestId('count-text')).toContain('Count: 1')
})
