// h5p-standalone ships its declarations in dist/ without a `types` entry in package.json.
declare module "h5p-standalone" {
  const h5pStandalone: {
    /** `new H5P(element, options)`; the object is a promise that settles once the content is rendered. */
    H5P: new (element: HTMLElement, options: Record<string, unknown>) => unknown
  }
  export default h5pStandalone
}
