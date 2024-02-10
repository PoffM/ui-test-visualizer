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
  spyOnDomNodes(cfg.classes, cfg.root, (node, prop, args) => {
    const nodePath = getNodePath(node, cfg.root)

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
  })
}
