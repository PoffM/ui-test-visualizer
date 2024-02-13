export function getPropertyDescriptor(
  obj: unknown,
  p: PropertyKey,
): {
  descriptor: PropertyDescriptor
  proto: unknown
} | undefined {
  for (
    let proto = obj;
    proto !== null;
    proto = Object.getPrototypeOf(proto)
  ) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, p)
    if (descriptor) {
      return { descriptor, proto }
    }
  }
}
