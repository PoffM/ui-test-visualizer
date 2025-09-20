import { expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import FormExample from '../components/FormExample'

it('renders FormExample with form and non-form sections', async () => {
  render(<FormExample />)

  // Fill form inputs and submit
  const firstInput = screen.getByLabelText('First input')
  await userEvent.type(firstInput, 'Test Value 1')
  expect((firstInput as HTMLInputElement).value).toBe('Test Value 1')

  await userEvent.click(screen.getByRole('heading', { name: /^form section$/i }))
  await userEvent.click(screen.getByRole('heading', { name: /^non-form section$/i }))
  await userEvent.click(screen.getByRole('heading', { name: /^form section$/i }))
  await userEvent.click(screen.getByRole('heading', { name: /^non-form section$/i }))
  await userEvent.click(screen.getByRole('textbox', { name: /^first input$/i }))
  await userEvent.dblClick(screen.getByRole('textbox', { name: /^outside input 1$/i }))
  await userEvent.dblClick(screen.getByRole('heading', { name: /^non-form section$/i }))
  await userEvent.dblClick(screen.getByRole('textbox', { name: /^outside input 1$/i }))
  await userEvent.type(screen.getByRole('textbox', { name: /^outside input 1$/i }), 'asdf')
  await userEvent.type(screen.getByRole('textbox', { name: /^outside input 2$/i }), 'fdsa')
  await userEvent.click(screen.getByRole('button', { name: /^submit$/i }))
  await userEvent.click(screen.getByRole('button', { name: /^outside button$/i }))
  const secondInput = screen.getByPlaceholderText('Second input')
  await userEvent.type(secondInput, 'Test Value 2')

  expect((secondInput as HTMLInputElement).value).toBe('Test Value 2')

  await userEvent.click(screen.getByText('Submit'))
})
