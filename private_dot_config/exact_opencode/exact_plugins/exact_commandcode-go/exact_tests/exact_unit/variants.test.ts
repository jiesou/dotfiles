import { expect, test } from "bun:test"
import { reasoningEffortsFor, reasoningVariants } from "../../src/variants.js"

test("reasoningEffortsFor uses CLI catalog for GPT-5.6 family", () => {
  expect(reasoningEffortsFor("gpt-5.6-luna")).toEqual(["low", "medium", "high", "xhigh", "max"])
  expect(reasoningEffortsFor("gpt-5.6-sol")).toEqual(["low", "medium", "high", "xhigh", "max"])
  expect(reasoningEffortsFor("gpt-5.6-terra")).toEqual(["low", "medium", "high", "xhigh", "max"])
})

test("reasoningEffortsFor uses CLI catalog for Claude models", () => {
  expect(reasoningEffortsFor("claude-sonnet-5")).toEqual(["low", "medium", "high", "xhigh", "max"])
  expect(reasoningEffortsFor("claude-opus-5")).toEqual(["low", "medium", "high", "xhigh", "max"])
})

test("reasoningEffortsFor uses CLI catalog for DeepSeek V4", () => {
  expect(reasoningEffortsFor("deepseek/deepseek-v4-flash")).toEqual(["high", "max"])
  expect(reasoningEffortsFor("deepseek/deepseek-v4-pro")).toEqual(["high", "max"])
})

test("reasoningEffortsFor falls back to low/medium/high for unknown models", () => {
  expect(reasoningEffortsFor("moonshotai/Kimi-K3")).toEqual(["low", "medium", "high"])
  expect(reasoningEffortsFor("unknown-model")).toEqual(["low", "medium", "high"])
})

test("reasoningVariants builds effort variants", () => {
  expect(reasoningVariants("gpt-5.6-luna")).toEqual({
    low: { reasoningEffort: "low" },
    medium: { reasoningEffort: "medium" },
    high: { reasoningEffort: "high" },
    xhigh: { reasoningEffort: "xhigh" },
    max: { reasoningEffort: "max" },
  })
  expect(reasoningVariants("deepseek/deepseek-v4-flash")).toEqual({
    high: { reasoningEffort: "high" },
    max: { reasoningEffort: "max" },
  })
})
