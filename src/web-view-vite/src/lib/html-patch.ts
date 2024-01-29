import { castArray } from "lodash";
import {
  DomNodePath,
  SerializedDomNode,
  getNodeByPath,
  parseDomNode,
} from "../../../dom-transport-utils";
import { HTMLPatch } from "../../../extension/ui-back-end";

export function applyHtmlPatch(shadow: ShadowRoot, htmlPatch: HTMLPatch) {
  let targetNode = getNodeByPath(shadow, htmlPatch.targetNodePath);
  if (!targetNode) {
    throw new Error("Node not found: " + String(htmlPatch.targetNodePath));
  }

  const propPath = castArray(htmlPatch.prop);

  const prop = propPath.at(-1);
  if (!prop) {
    throw new Error("No property found in path: " + propPath);
  }

  const pathBeforeProp = propPath.slice(0, -1);
  for (const key of pathBeforeProp) {
    // @ts-expect-error The key should exist on this node because it comes from the same node on the server.
    targetNode = targetNode[key];
  }

  // Check if the property is a function
  // @ts-expect-error
  const targetFn = targetNode[prop];
  if (typeof targetFn === "function") {
    const parsedArgs = htmlPatch.args.map((arg) => {
      if (Array.isArray(arg)) {
        // If the first element is a string (the tag), it's a serialized dom node
        if (typeof arg[0] === "string") {
          return parseDomNode(arg as SerializedDomNode, window);
        }
        // If the first element is a number, it's a path to an existing node
        if (typeof arg[0] === "number") {
          return getNodeByPath(shadow, arg as DomNodePath);
        }
      }

      // If the property is a path array or the arg is a string or null, the arg is plain text
      if (propPath.length > 1 || arg === null || typeof arg === "string") {
        return arg;
      }

      throw new Error("Unknown mutation arg type: " + arg);
    });

    // @ts-expect-error
    targetNode[prop](...parsedArgs);
    return;
  }

  // Check if the property is a setter
  const propDescriptor = (() => {
    for (
      let proto = Object.getPrototypeOf(targetNode);
      proto !== null;
      proto = Object.getPrototypeOf(proto)
    ) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
      if (descriptor) {
        return descriptor;
      }
    }
  })();
  if (typeof propDescriptor?.set === "function") {
    propDescriptor.set.call(targetNode, htmlPatch.args[0]);
    return;
  }

  throw new Error("Unknown node property type: " + htmlPatch.prop);
}
