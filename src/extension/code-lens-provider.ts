import { ItBlock, ParsedNode, parse } from "jest-editor-support";
import * as vscode from "vscode";
import { CodeLens, Range } from "vscode";

export const codeLensProvider: vscode.CodeLensProvider = {
  provideCodeLenses(document) {
    try {
      const rootNode = parse(document.fileName, document.getText(), {
        plugins: { decorators: "legacy" },
      }).root;

      const codeLenses: vscode.CodeLens[] = [];
      for (const node of allNodes(rootNode)) {
        if (node instanceof ItBlock) {
          const range = new Range(
            node.start.line - 1,
            node.start.column,
            node.end.line - 1,
            node.end.column
          );

          codeLenses.push(
            new CodeLens(range, {
              arguments: [node.name],
              title: "Visually Debug UI",
              command: "visual-ui-test-debugger.debugJest",
            })
          );
        }
      }

      return codeLenses;
    } catch (e) {
      // Ignore error and keep showing Run/Debug buttons at same position
      console.error("jest-editor-support parser threw error", e);
    }
  },
};

/** Iterate over all nodes in the tree. */
function* allNodes(node: ParsedNode): Generator<ParsedNode> {
  yield node;
  for (const child of node.children ?? []) {
    yield* allNodes(child);
  }
}
