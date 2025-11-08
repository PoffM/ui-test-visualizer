import { expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { FormExample } from '../components/FormExample'

it('renders FormExample with form and non-form sections', async () => {
  (() => render(<FormExample />))()

  // Fill form inputs and submit
  const firstInput = screen.getByLabelText('First input')
  await userEvent.type(firstInput, 'Test Value 1')
  expect((firstInput as HTMLInputElement).value).toBe('Test Value 1')

  const secondInput = screen.getByPlaceholderText('Second input')
  await userEvent.type(secondInput, 'Test Value 2')

  expect((secondInput as HTMLInputElement).value).toBe('Test Value 2')
})
