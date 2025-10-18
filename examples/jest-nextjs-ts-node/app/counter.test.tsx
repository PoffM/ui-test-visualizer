import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { Counter } from './Counter'

it('simple react testing library test', () => {
  // TODO the test sometimes fails if this comment is missing; trouble with putting a breakpoint on the first line of the test
  renderCounter()

  fireEvent.click(screen.getByText('Increment'))
  fireEvent.click(screen.getByText('Increment'))
  fireEvent.click(screen.getByText('Decrement'))

  expect(screen.getByText('Count: 1')).toBeTruthy()
})

// For some reason calling 'render' in the test block needs multiple
// debugger "Step Over"s to move through. It's easier to e2e test this test if
// the render is done in a separate function.
function renderCounter() {
  render(<Counter />)
}
