import { createSignal } from 'solid-js'

export function Counter() {
  const [count, setCount] = createSignal(0)

  function increment() {
    setCount(count() + 1)
  };

  function decrement() {
    setCount(count() - 1)
  };

  return (
    <div>
      <h1>Counter</h1>
      <div>Count: {count()}</div>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  )
}
