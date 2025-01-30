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
    <div className="counter-app">
      <h1>Counter</h1>
      <p>Count: {count}</p>
      <button onClick={increment} className="green-button !visible">Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  )
}
