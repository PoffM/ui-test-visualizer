import type { HTMLPatch } from '../types'
import { spyOnDomNodes } from './spy-on-dom-nodes'
import { getNodePath, serializeDomMutationArg } from './serialize-mutations'
import type { DomClasses } from './mutable-dom-props'

export interface PrimaryDomConfig {
  root: Node
  classes: DomClasses
  onMutation: (patch: HTMLPatch) => void
}

export function initPrimaryDom(cfg: PrimaryDomConfig) {
  spyOnDomNodes(
    cfg.classes,
    cfg.root,
    function emitHtmlPatch(node, prop, args, spyDepth) {
      // Don't emit patches for nested mutations.
      // e.g. a Node's "remove()" might call "removeChild()" internally,
      // so we only want to replicate the top-level remove() call.
      if (spyDepth > 1) {
        return
      }

      const nodePath = getNodePath(node, cfg.root, cfg.classes)

      if (!nodePath) {
        return
      }

      const serializedArgs = args.map(it =>
        serializeDomMutationArg(it, cfg.root, cfg.classes),
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
