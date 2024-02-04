import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { Counter } from '../components/Counter'

it('simple react testing library test', () => {
  render(<Counter />)

  fireEvent.click(screen.getByText('Increment'))
  fireEvent.click(screen.getByText('Increment'))
  fireEvent.click(screen.getByText('Decrement'))

  expect(screen.getByText('Count: 1')).toBeTruthy()
})
