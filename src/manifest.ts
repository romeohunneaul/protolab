import type { ComponentType } from "react";

/** A dynamic import of a React component: the code ships only when the lab renders it. */
export type Loader = () => Promise<{ default: ComponentType }>;

/** One prototype of the host project, registered in the manifest. A v1 entry stays valid as is. */
export type Proto = {
  /** Unique in the manifest, kebab-case. Path segment of the page: `<basePath>/p/<slug>`. */
  slug: string;
  /** Shown in the lab index and in the panel. */
  name: string;
  /** Shown in the lab index. */
  author: string;
  /** One sentence, shown in the lab index. */
  description: string;
  /** Path of the proto's brief, relative to the host project root. Read by the skills; `protolab-check` requires the file to exist. */
  brief?: string;
  /** The proto's axes, in panel order. Absent or empty: no axis. */
  axes?: Axis[];
  /** The proto's screens, in panel order; the first one is the landing screen. Absent or empty: one screen. */
  screens?: Screen[];
  /** The proto's context scenarios, in panel order. Absent or empty: no scenario. */
  scenarios?: Scenario[];
  /** True when the proto uses a library listed in `ds.offDs` of protolab.config.json. Absent: false. */
  offDs?: boolean;
  /** The proto's root component. Always required, even when a structural axis covers the whole screen. */
  load: Loader;
};

/** A dimension of a proto. Values are orthogonal: any combination with the other axes, screens and scenarios is valid. */
export type Axis = {
  /** Unique among the proto's axes, kebab-case. Link parameter: `a.<key>`. */
  key: string;
  /** Shown in the panel. */
  label: string;
  /** Absent: "state". A state axis is read by the proto with useAxis(); a structural axis is rendered by the engine through <AxisSlot />. */
  kind?: "state" | "structural";
  /** At least one. The first one is the default unless `default` says otherwise. */
  values: AxisValue[];
  /** Id of the default value; one of `values`. */
  default?: string;
};

/** One value of an axis. */
export type AxisValue = {
  /** Unique in the axis, kebab-case. Link value of `a.<key>`. */
  id: string;
  /** Shown in the panel, and as the cell title in the comparison view. */
  label: string;
  /** Structural axis only: the component the engine renders for this value. Required on every value of a structural axis, forbidden on a state axis. */
  load?: Loader;
};

/** One view of a multi-screen proto. The proto moves between screens with useScreen().go(). */
export type Screen = {
  /** Unique among the proto's screens, kebab-case. Link parameter: `screen=<key>`. */
  key: string;
  /** Shown in the panel. */
  label: string;
  /** Labels of the screen's steps, in order. Link parameter: `step=<n>`, 1-based. Absent or empty: one step. */
  steps?: string[];
};

/** A context the proto is rendered in: a data set, a role, a volume. The proto reads it with useScenario(). */
export type Scenario = {
  /** Unique among the proto's scenarios, kebab-case. Link parameter: `s.<key>`. */
  key: string;
  /** Shown in the panel. */
  label: string;
  /** At least one. The first one is the default unless `default` says otherwise. */
  values: ScenarioValue[];
  /** Id of the default value; one of `values`. */
  default?: string;
};

/** One value of a scenario: a data set the proto renders with. */
export type ScenarioValue = {
  /** Unique in the scenario, kebab-case. Link value of `s.<key>`. */
  id: string;
  /** Shown in the panel. */
  label: string;
  /** Loads this value's data set, on the client, when the value is current. Absent: useScenario() gives `data: undefined`. */
  data?: () => Promise<unknown>;
};

/**
 * Type the host project's manifest. The host owns the array (one hand-editable file, no
 * generated file to fight with); `protolab-new` appends to it.
 */
export const defineProtos = (protos: Proto[]): Proto[] => protos;

export const findProto = (protos: Proto[], slug: string) => protos.find((p) => p.slug === slug);
