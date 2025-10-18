import React, { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  function increment() {
    setCount(c => c + 1)
  };

  function decrement() {
    setCount(c => c - 1)
  };

  return (
    <div>
      <h1>Counter</h1>
      <div>Count: {count}</div>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  )
}
