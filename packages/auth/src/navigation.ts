/**
 * The only place that changes the browser location, so tests can spy on `navigation.assign`
 * instead of letting happy-dom navigate.
 */
export const navigation = {
  assign(url: string): void {
    window.location.assign(url)
  },
}
