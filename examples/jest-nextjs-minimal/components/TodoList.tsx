import React, { useState } from 'react'

interface Todo {
  id: number
  text: string
  completed: boolean
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }])
      setInput('')
    }
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const doneCount = todos.filter(todo => todo.completed).length
  const notDoneCount = todos.filter(todo => !todo.completed).length

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-white">Todo List</h1>
          <div className="text-sm text-gray-400 mt-1 space-y-0.5">
            <div>{doneCount} done</div>
            <div>{notDoneCount} in progress</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
            placeholder="Add a new todo"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600"
          />
          <button
            onClick={addTodo}
            className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {todos.map(todo => (
            <div key={todo.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded border border-gray-700 group">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="h-4 w-4 rounded border-gray-600 cursor-pointer"
                aria-label="Toggle done"
              />
              <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 flex items-center justify-center hover:bg-muted rounded"
                aria-label="Delete"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
        </div>

        {todos.length === 0 && (
          <p aria-label="no-todos-message" className="text-center text-gray-400 text-sm mt-8">No todos yet. Add one to get started.</p>
        )}
      </div>
    </div>
  )
}
