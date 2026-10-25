// The lab's own look, shared by the panel and the index, so neither reads as part of a proto: what
// they must not inherit from the host (the font, light form controls) and a focus ring that reads on
// their dark background. Plain module: a server component (the index) imports it too.
export const CHROME = "font-sans [color-scheme:dark] [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-sky-400";
