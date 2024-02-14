/** Go up the prototype chain until you get the descriptor for your given property key. */
export function getPropertyDescriptor(
  obj: object,
  p: PropertyKey,
): PropertyDescriptor | undefined {
  for (
    let proto = obj;
    proto !== null;
    proto = Object.getPrototypeOf(proto)
  ) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, p)
    if (descriptor) {
      return descriptor
    }
  }
}

/**
 * Go up the prototype chain and get the descriptor from the highest prototype that
 * implements it for your given property key.
 */
export function getHighestPropertyDescriptor(
  obj: object,
  p: PropertyKey,
): PropertyDescriptor | undefined {
  let descriptor: PropertyDescriptor | undefined
  for (
    let proto = obj;
    proto !== null;
    proto = Object.getPrototypeOf(proto)
  ) {
    descriptor = Object.getOwnPropertyDescriptor(proto, p) ?? descriptor
  }
  return descriptor
}
