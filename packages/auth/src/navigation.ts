/**
 * The only place that changes the browser location, so tests can spy on `navigation.assign`
 * instead of letting happy-dom navigate.
 */
export const navigation = {
  assign(url: string): void {
    window.location.assign(url)
  },
  /** Leaves the page without adding a history entry (the login redirect: Back must not return to a login trigger). */
  replace(url: string): void {
    window.location.replace(url)
  },
}
