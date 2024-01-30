import {
  SerializedDomElement,
  SerializedDomNode,
  SerializedTextNode,
} from "../types";

export function getNodeByPath(root: ParentNode, path: number[]) {
  let currentElement: ParentNode | ChildNode | undefined = root;

  for (const index of path) {
    currentElement = currentElement?.childNodes?.[index];
    if (!currentElement) {
      return null;
    }
  }

  return currentElement;
}

export function parseDomNode(node: SerializedDomNode, win: Window): Node {
  if (typeof node === "string" || node === null) {
    return win.document.createTextNode(node ?? "");
  }
  if (Array.isArray(node) && node[0] === "Text") {
    const [, text] = node as SerializedTextNode;
    return win.document.createTextNode(text ?? "");
  }
  if (Array.isArray(node)) {
    const [tag, attributes, children] = node as SerializedDomElement;
    const element = win.document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, value);
    }
    const parsedChildren = children.map((child) => parseDomNode(child, win));
    element.append(...parsedChildren);
    return element;
  }
  throw new Error("Unhandled node type: " + node);
}
