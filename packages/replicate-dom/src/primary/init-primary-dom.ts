import type { HTMLPatch } from '../types'
import { spyOnDomNodes } from './spy-on-dom-nodes'
import { getNodePath, serializeDomMutationArg } from './serialize-mutations'

export interface PrimaryDomConfig {
  root: Node
  win: typeof window
  onMutation: (patch: HTMLPatch) => void
}

export function initPrimaryDom(cfg: PrimaryDomConfig) {
  spyOnDomNodes(
    cfg.win,
    cfg.root,
    function emitHtmlPatch(node, prop, args, spyDepth) {
      // Don't emit patches for nested mutations.
      // e.g. a Node's "remove()" might call "removeChild()" internally,
      // so we only want to replicate the top-level remove() call.
      if (spyDepth > 1) {
        return
      }

      // Ignore operations involving doctype nodes
      if ([node, ...args].some(it => it instanceof cfg.win.DocumentType)) {
        return
      }

      const nodePath = getNodePath(node, cfg.root, cfg.win)

      if (!nodePath) {
        return
      }

      const serializedArgs = args.map(it =>
        serializeDomMutationArg(it, cfg.root, cfg.win),
      )

      const htmlPatch: HTMLPatch = {
        targetNodePath: nodePath,
        prop,
        args: serializedArgs,
      }

      cfg.onMutation(htmlPatch)
    },
  )
}
