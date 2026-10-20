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
    description: "Three screens, a checkout in three steps, a state axis, a structural axis for the list, and a volume scenario.",
    screens: [
      { key: "list", label: "List" },
      { key: "detail", label: "Detail" },
      { key: "checkout", label: "Checkout", steps: ["Address", "Payment", "Confirmation"] },
    ],
    axes: [
      { key: "density", label: "Density", values: [
        { id: "comfortable", label: "Comfortable" },
        { id: "compact", label: "Compact" },
      ] },
      { key: "layout", label: "List layout", kind: "structural", values: [
        { id: "table", label: "Table", load: () => import("./protos/flow/list-table") },
        { id: "cards", label: "Cards", load: () => import("./protos/flow/list-cards") },
      ] },
    ],
    scenarios: [
      { key: "volume", label: "Volume", default: "12", values: [
        { id: "0", label: "0 invoices", data: () => import("./protos/flow/data").then((m) => m.invoices(0)) },
        { id: "12", label: "12 invoices", data: () => import("./protos/flow/data").then((m) => m.invoices(12)) },
        { id: "500", label: "500 invoices", data: () => import("./protos/flow/data").then((m) => m.invoices(500)) },
      ] },
    ],
    load: () => import("./protos/flow"),
  },
]);
