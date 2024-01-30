import { SerializedDomNode } from "../types";

export function getNodePath(node: Node, root: Node) {
  const indices = [];
  let currentNode = node;

  // Traverse up the tree until the root node is reached
  while (currentNode && currentNode !== root) {
    let parent = currentNode.parentNode;

    // When the parent is the root, use "children" instead of "childNodes" to ignore the "<!DOCTYPE html>" node.
    const siblings = parent === root ? parent.children : parent!.childNodes;

    let index = Array.prototype.indexOf.call(siblings, currentNode);

    // TODO handle text nodes properly
    if (index === -1) {
      index = 0;
    }

    indices.unshift(index); // Add the index to the beginning of the array
    currentNode = parent!;
  }

  // If the root node is not an ancestor of the node, return null
  if (currentNode !== root) {
    return null;
  }

  return indices;
}

export function serializeDomMutationArg(
  arg: string | Node | null,
  win: Window
) {
  if (
    typeof arg === "string" ||
    typeof arg === "number" ||
    typeof arg === "boolean"
  ) {
    return String(arg);
  }
  if (arg === null) {
    return arg;
  }
  // Existing nodes are referenced by their numeric path,
  // so the receiver can look them up in its DOM
  if (arg instanceof Node && win.document.contains(arg)) {
    return getNodePath(arg, win.document);
  }
  if (arg instanceof Element || arg instanceof Text) {
    return serializeDomNode(arg);
  }
  throw new Error(`Unknown node type: ${arg}`);
}

function serializeDomNode(node: Node): SerializedDomNode {
  if (node instanceof Text) {
    return ["Text", node.textContent];
  } else if (node instanceof Element) {
    const attributes: Record<string, string> = {};
    for (const attr of Array.from(node.attributes)) {
      attributes[attr.name] = attr.value;
    }

    const children = Array.from(node.childNodes).map(serializeDomNode);

    return [node.tagName.toLowerCase(), attributes, children];
  }
  throw new Error("Unhandled node type: " + node.nodeType);
}
