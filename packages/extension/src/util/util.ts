/**
 * Creates a function that is restricted to invoking func once.
 * Repeat calls to the function return the value of the first call.
 * The func is invoked with the this binding and arguments of the created function.
 *
 * You can peek at the result of the first call to the function by calling the peek() method.
 *
 * Copied and adapted from lodash's 'once' function.
 */
export function onceWithPeek<T extends (...args: any[]) => any>(fn: T): {
  (): ReturnType<T>
  peek: () => ReturnType<T> | undefined
} {
  let called = false
  let result: ReturnType<T>

  const wrapper = (...args: Parameters<T>): ReturnType<T> => {
    if (!called) {
      result = fn(...args)
      called = true
    }
    return result
  }

  wrapper.peek = (): ReturnType<T> | undefined => {
    return called ? result : undefined
  }

  return wrapper
}
