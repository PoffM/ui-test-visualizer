import { render } from '@testing-library/react'
import { TodoList } from './TodoList'

test('basic usage', async () => {
  (() => render(<TodoList />))()
})
