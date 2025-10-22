import { expect, it } from 'bun:test'
import { fireEvent, render, screen } from '@solidjs/testing-library'
import { Counter } from '../src/Counter'

it('simple react testing library test', () => {
  render(() => <Counter />)

  fireEvent.click(screen.getByText('Increment'))
  fireEvent.click(screen.getByText('Increment'))
  fireEvent.click(screen.getByText('Decrement'))

  expect(screen.getByText('Count: 1'))
})
