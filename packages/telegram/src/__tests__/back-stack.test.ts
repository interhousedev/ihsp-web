import { describe, expect, test } from "bun:test"
import { createBackStack } from "../back-stack"

describe("createBackStack", () => {
  test("is empty at first", () => {
    expect(createBackStack().current()).toBeUndefined()
  })

  test("the page's back link wins over the shell's fallback, whatever the mount order", () => {
    const stack = createBackStack()
    const page = () => undefined
    const shell = () => undefined
    stack.add(page, false)
    stack.add(shell, true)
    expect(stack.current()).toBe(page)
  })

  test("the fallback takes over when the page's handler goes", () => {
    const stack = createBackStack()
    const shell = () => undefined
    stack.add(shell, true)
    const remove = stack.add(() => undefined, false)
    remove()
    expect(stack.current()).toBe(shell)
  })

  test("the latest page handler is the one that runs", () => {
    const stack = createBackStack()
    const first = () => undefined
    const second = () => undefined
    stack.add(first, false)
    stack.add(second, false)
    expect(stack.current()).toBe(second)
  })
})
