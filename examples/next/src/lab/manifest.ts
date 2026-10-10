import { defineProtos } from "@romeohunneaul/protolab";

/** Source of truth for the lab. `protolab-new` appends entries here; nothing else registers a proto. */
export const PROTOS = defineProtos([
  {
    slug: "hello",
    name: "Hello",
    author: "protolab",
    description: "The smallest proto: one axis, three states, switchable from the panel and the URL.",
    axes: [
      { key: "state", label: "State", values: [
        { id: "rest", label: "Rest" },
        { id: "loading", label: "Loading" },
        { id: "empty", label: "Empty" },
      ] },
    ],
    load: () => import("./protos/hello"),
  },
  {
    slug: "flow",
    name: "Flow",
    author: "protolab",
    description: "Two screens the proto moves between with useScreen(), plus one axis. Back walks the flow.",
    screens: [
      { key: "list", label: "List" },
      { key: "detail", label: "Detail" },
    ],
    axes: [
      { key: "density", label: "Density", values: [
        { id: "comfortable", label: "Comfortable" },
        { id: "compact", label: "Compact" },
      ] },
    ],
    load: () => import("./protos/flow"),
  },
]);
