import { render, screen } from '@testing-library/react'
import React from 'react'
import { FormExample } from '../components/FormExample'

describe('form test for e2e test', () => {
  it('basic usage', async () => {
    render(<FormExample />)
    expect(screen.getByLabelText('First input'))
  })
})
