import type { ComponentType } from "react";
import type { Axis, Screen } from "./variants";

/** One prototype. `load` is a dynamic import so a proto ships only when its page is opened. */
export type Proto = {
  slug: string;
  name: string;
  author: string;
  description: string;
  axes?: Axis[];
  /** Views of a multi-screen proto; the first is the landing one. */
  screens?: Screen[];
  load: () => Promise<{ default: ComponentType }>;
};

/**
 * Type the host project's manifest. The host owns the array (one hand-editable file, no
 * generated file to fight with); `protolab-new` appends to it.
 */
export const defineProtos = (protos: Proto[]): Proto[] => protos;

export const findProto = (protos: Proto[], slug: string) => protos.find((p) => p.slug === slug);
