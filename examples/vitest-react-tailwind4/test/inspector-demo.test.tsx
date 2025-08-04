import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { Counter } from '../../jest-react/components/Counter'

it('example ui test to be run within the e2e test', async () => {
  setupUi()

  expect(screen.getByText('Count: 1')).toBeTruthy()
  expect(screen.getByText('Count: 1')).toBeTruthy()
})

function setupUi() {
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
    <button id="increment">Increment</button>
    <button id="decrement">Decrement</button>
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
    <button id="nested-increment">Increment</button>
    <button id="nested-decrement">Decrement</button>
  `
  nestedShadow.appendChild(nestedCounter)

  // === Step 3: Increment twice, decrement once
  fireEvent.click(screen.getByText('Increment'))
  fireEvent.click(screen.getByText('Increment'))
  fireEvent.click(screen.getByText('Decrement'))

  // === Step 4: Modify the first h1 title's text and append text nodes
  const h1 = screen.getByRole('heading', { level: 1 })
  h1.textContent = 'Modified Title'
  h1.appendChild(document.createTextNode(' - Extra Text 1'))
  h1.appendChild(document.createTextNode(' - Extra Text 2'))
}

it('kitchen sink test for inspector development', async () => {
  setupUi()

  // === Step 4: Create 100 divs with data-testid="1" through "100"
  let container = document.body
  for (let i = 1; i <= 100; i++) {
    const div = document.createElement('div')
    div.setAttribute('data-testid', `${i}`)
    container.appendChild(div)
    container = div
  }

  // === Step 5: Add long text
  const longText = document.createTextNode('Long text '.repeat(100))
  const longTextDiv = document.createElement('div')
  longTextDiv.appendChild(longText)
  document.body.appendChild(longTextDiv)

  // === Step 6: Add many attributes to the same element
  const attrsDiv = document.createElement('div')
  attrsDiv.textContent = 'Many attributes on this div'
  document.body.appendChild(attrsDiv)
  for (let i = 0; i < 100; i++) {
    attrsDiv.setAttribute(`data-attr-${i}`, `value`)
    attrsDiv.setAttribute(`data-attr-${i}`, `value-${i}`)
  }
  attrsDiv.appendChild(document.createElement('div'))
})
