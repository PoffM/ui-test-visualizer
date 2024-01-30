import { HTMLPatch } from "../types";
import { spyOnDomNodes } from "./dom-spies";
import { getNodePath, serializeDomMutationArg } from "./serialize-mutations";

export type PrimaryDomConfig = {
  root: Window;
} & (
  | {
      /** Only patch the part of the DOM that updated. */
      patchMode: true;
      onMutation: (message: HTMLPatch) => void;
    }
  | {
      /** Emit the entire HTML document string on every mutation. */
      patchMode: false;
      onMutation: (newHtml: string) => void;
    }
);

export function initPrimaryDom(cfg: PrimaryDomConfig) {
  let lastHtml = "";
  spyOnDomNodes((node, prop, args) => {
    if (cfg.patchMode === false) {
      const newHtml = cfg.root.document.documentElement.outerHTML;

      if (newHtml === lastHtml) {
        return;
      }
      lastHtml = newHtml;

      cfg.onMutation(newHtml);
    }

    if (cfg.patchMode === true) {
      const nodePath = getNodePath(node, window.document);

      if (!nodePath) {
        throw new Error("Could not find node path for node");
      }

      const serializedArgs = args.map((it) =>
        serializeDomMutationArg(it, window)
      );

      const htmlPatch: HTMLPatch = {
        targetNodePath: nodePath,
        prop,
        args: serializedArgs,
      };

      cfg.onMutation(htmlPatch);
    }
  });
}
