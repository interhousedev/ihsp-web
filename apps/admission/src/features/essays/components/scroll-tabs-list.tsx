  // Keep the active tab visible: on load and whenever the active tab changes.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reveal = () =>
      el.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      })
    reveal()
    const observer = new MutationObserver(reveal)
    observer.observe(el, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] })
    return () => observer.disconnect()
  }, [])
