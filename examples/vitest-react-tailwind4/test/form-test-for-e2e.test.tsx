import { describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormExample } from '../components/FormExample'

describe('form test for e2e test', () => {
  it('basic usage', async () => {
    setupUi()
    expect(screen.getByLabelText('First input')).toBeTruthy()
  })
})

function setupUi() {
  render(<FormExample />)
}
