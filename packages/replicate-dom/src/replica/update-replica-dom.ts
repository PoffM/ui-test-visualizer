import morphdom from 'morphdom'
import type { HTMLPatch } from '../types'
import { applyDomPatch } from './patch-dom'

export function updateDomReplica(root: Node, message: string | HTMLPatch) {
  if (typeof message === 'string') {
    morphdom(root, message)
  }
  else {
    applyDomPatch(root, message)
  }
}
