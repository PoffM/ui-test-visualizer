import type { HTMLPatch } from '../types'
import { spyOnDomNodes } from './spy-on-dom-nodes'
import { getNodePath, serializeDomMutationArg } from './serialize'

export interface PrimaryDomConfig {
  root: Node
  win: typeof window
  onMutation: (patch: HTMLPatch) => void
}

export function initPrimaryDom(cfg: PrimaryDomConfig): void {
  spyOnDomNodes(
    cfg.win,
    cfg.root,
    function emitHtmlPatch(node, prop, args) {
      // Ignore operations involving doctype nodes
      if ([node, ...args].some(it => it instanceof cfg.win.DocumentType)) {
        return
      }

      if (!(node instanceof cfg.win.Node || node instanceof cfg.win.Location)) {
        throw new TypeError('Expected first arg to be an instance of Node')
      }

      const nodePath = getNodePath(node, cfg.root, cfg.win)

      if (!nodePath) {
        throw new Error('Node not found in DOM')
      }

      const serializedArgs = args.map(it => Array.isArray(it)
        ? it
        : serializeDomMutationArg(it, cfg.root, cfg.win),
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
