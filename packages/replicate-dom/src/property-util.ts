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
