import React from 'react'
import { render, screen } from '@testing-library/react'
import Link from '../components/Link'

test('simple react testing library test', () => {
  render(<Link page="http://google.ca">Mat P</Link>)

  const linkElement = screen.getByText('Mat P')
  expect(linkElement.innerText).toBe('Mat P')
})
