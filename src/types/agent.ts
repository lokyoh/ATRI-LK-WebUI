export interface FunctionCallingArgInfo {
  name: string
  type: string
  description: string
}

/** 某个等级对该功能的默认求值结果 */
export interface PermissionDecisionInfo {
  allowed: boolean
  reason: string
  scope: string
  action: string
  chain: string[]
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
  /** chat / group / bot */
  scope: string
  scope_by_action: Record<string, string>
  /** 等级（master/admin/user）→ 默认求值 */
  permission: Record<string, PermissionDecisionInfo>
  /** 不常用功能：不进提示词，只能经 call 调用 */
  rare: boolean
}

/** 作用域的中文名，与后端 FunctionScope 一致 */
export const SCOPE_LABELS: Record<string, string> = {
  chat: '单聊',
  group: '群内',
  bot: '全局',
}

/** 三个等级的显示顺序与中文名 */
export const LEVEL_ORDER = ['master', 'admin', 'user'] as const
export const LEVEL_LABELS: Record<string, string> = {
  master: '主人',
  admin: '管理',
  user: '用户',
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
