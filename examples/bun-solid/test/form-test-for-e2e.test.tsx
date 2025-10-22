import { render, screen } from '@solidjs/testing-library'
import { describe, expect, it } from 'bun:test'
import { FormExample } from '../src/FormExample'

describe('form test for e2e test', () => {
  it('basic usage', async () => {
    render(() => <FormExample />)
    expect(screen.getByLabelText('First input'))
  })
})
