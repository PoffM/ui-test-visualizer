import morphdom from "morphdom";
import { HTMLPatch } from "../types";
import { applyDomPatch } from "./patch-dom";

export function updateDomReplica(root: ParentNode, message: string | HTMLPatch) {
  if (typeof message === "string") {
    morphdom(root, message);
  } else {
    applyDomPatch(root, message);
  }
}
