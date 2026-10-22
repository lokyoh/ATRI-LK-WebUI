import type { ModelPricingInfo, TokenUsageSummary } from '@/types/agent'

/** 与后端 TokenUsage 对应的费用计算结果（单位：元） */
export interface CostBreakdown {
  /** 非缓存命中输入部分的费用 */
  inputCost: number
  /** 缓存命中输入部分的费用 */
  cacheHitCost: number
  /** 输出部分的费用 */
  outputCost: number
  /** 总费用 */
  total: number
  /** 是否配置了计费（false 表示费用不可估算） */
  priced: boolean
}

/** 缓存命中率：缓存命中 Token / 输入 Token，输入为 0 时返回 0 */
export function cacheHitRate(usage: TokenUsageSummary): number {
  if (!usage.prompt_tokens || usage.prompt_tokens <= 0) return 0
  const hit = Math.min(Math.max(0, usage.cache_hit_tokens), usage.prompt_tokens)
  return hit / usage.prompt_tokens
}

/**
 * 依据模型计费配置估算一段用量的费用。
 * 规则与后端 ModelPricing.calculate_cost 保持一致：缓存命中是输入的子集，
 * 命中部分按 cache_hit 单价、其余按 input 单价，输出按 output 单价，再除以 unit_tokens。
 */
export function calculateUsageCost(
  usage: TokenUsageSummary,
  pricingInfo: ModelPricingInfo | undefined,
): CostBreakdown {
  const empty: CostBreakdown = {
    inputCost: 0,
    cacheHitCost: 0,
    outputCost: 0,
    total: 0,
    priced: false,
  }
  if (!pricingInfo) return empty

  const { pricing, unit_tokens: unitTokens } = pricingInfo
  if (!unitTokens || unitTokens <= 0) return empty

  const prompt = Math.max(0, usage.prompt_tokens || 0)
  const output = Math.max(0, usage.output_tokens || 0)
  const cacheHit = Math.min(Math.max(0, usage.cache_hit_tokens || 0), prompt)
  const normalInput = prompt - cacheHit

  const inputCost = (normalInput * pricing.input) / unitTokens
  const cacheHitCost = (cacheHit * pricing.cache_hit) / unitTokens
  const outputCost = (output * pricing.output) / unitTokens

  return {
    inputCost,
    cacheHitCost,
    outputCost,
    total: inputCost + cacheHitCost + outputCost,
    priced: true,
  }
}

/** 按数值大小自适应小数位，展示金额（元） */
export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '-'
  const abs = Math.abs(value)
  let fractionDigits = 2
  if (abs > 0 && abs < 0.01) fractionDigits = 6
  else if (abs > 0 && abs < 1) fractionDigits = 4
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`
}

/** 百分比展示 */
export function formatPercent(rate: number): string {
  if (!Number.isFinite(rate)) return '-'
  return `${(rate * 100).toFixed(2)}%`
}
