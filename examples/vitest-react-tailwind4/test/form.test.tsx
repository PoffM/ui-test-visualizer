import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import FormExample from '../components/FormExample'

it('renders FormExample with form and non-form sections', async () => {
  render(<FormExample />)

  // Fill form inputs and submit
  fireEvent.change(screen.getByLabelText('First input'), { target: { value: 'Test Value 1' } })
  fireEvent.change(screen.getByPlaceholderText('Second input'), { target: { value: 'Test Value 2' } })
  fireEvent.click(screen.getByText('Submit'))
  fireEvent.change(screen.getByPlaceholderText('Second input'), { target: { value: 'Test Value 2' } })
})
