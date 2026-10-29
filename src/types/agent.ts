export interface FunctionCallingArgInfo {
  name: string
  type: string
  description: string
}

export interface FunctionCallingInfo {
  name: string
  description: string
  args: FunctionCallingArgInfo[]
  manually_enabled: boolean
  always_enabled: boolean
  can_enable: boolean
  can_enable_reason: string
  plugin?: string | null
}

export interface FunctionCallingState {
  name: string
  manually_enabled: boolean
}

export interface PluginSkillInfo {
  name: string
  description: string
  enabled: boolean
  embedded: boolean
  missing: boolean
}

export interface PluginFunctionInfo {
  name: string
  description: string
  rare: boolean
  enabled: boolean
  always_enabled: boolean
  can_enable: boolean
  can_enable_reason: string
  missing: boolean
}

export interface FunctionPluginInfo {
  name: string
  description: string
  enabled: boolean
  skills: PluginSkillInfo[]
  functions: PluginFunctionInfo[]
  rare_functions: PluginFunctionInfo[]
}

export interface FunctionPluginState {
  name: string
  enabled: boolean
}

export type SkillSource = 'builtin' | 'user' | 'modified'

export interface SkillInfo {
  name: string
  description: string
  source: SkillSource
  enabled: boolean
  embedded: boolean
  deletable: boolean
  content_length: number
}

export interface SkillDetail extends SkillInfo {
  content: string
}

export interface SaveSkillPayload {
  name: string
  description: string
  content: string
}

export interface SetSkillStatePayload {
  name: string
  enabled?: boolean
  embedded?: boolean
}

/** 模型计费单价，单位：元 / 每百万 Token */
export interface ModelPricing {
  input: number
  output: number
  cache_hit: number
}

/** /agent/get_model_pricing 返回的单个模型计费信息 */
export interface ModelPricingInfo {
  pricing: ModelPricing
  unit_tokens: number
}

export interface TokenUsageSummary {
  prompt_tokens: number
  output_tokens: number
  cache_hit_tokens: number
}

/** /agent/get_token_usage 返回的单条用量记录 */
export interface TokenUsageItem {
  name: string
  event: string
  usage: TokenUsageSummary
  time: string
}

export interface TokenUsageResponse {
  suc: boolean
  code?: number
  info: string
  data?: Record<string, TokenUsageItem[]>
}

export interface ModelPricingResponse {
  suc: boolean
  code?: number
  info: string
  data?: Record<string, ModelPricingInfo>
}
