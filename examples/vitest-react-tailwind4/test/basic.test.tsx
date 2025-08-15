import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { Counter } from '../components/Counter'

it('simple react testing library test', () => {
  setupUi() // For some reason with Vitest 3 and 4, you need to press the Step Over button 3 times if you call 'render' directly here.

  fireEvent.click(screen.getByText('Increment'))
  fireEvent.click(screen.getByText('Increment'))
  fireEvent.click(screen.getByText('Decrement'))

  expect(screen.getByText('Count: 1')).toBeTruthy()
})

function setupUi() {
  render(<Counter />)
}
