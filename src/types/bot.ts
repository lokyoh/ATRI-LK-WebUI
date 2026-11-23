/**
 * 后端 BaseInfo/BotInfo 模型的前端单一类型来源。
 *
 * 此前同一结构在 stores/main.ts、HomePage.vue、dashboard/MidInfo.vue、
 * dashboard/LeftInfo.vue、command/BotSwitcher.vue 五处重复定义，
 * 字段变更需要改五处——现在统一从这里 import。
 */
export interface BotInfo {
  self_id: string
  nickname: string
  ava_url: string
  friend_count: number
  group_count: number
  received_messages: number
  connect_time: number
  connect_date: string
  connect_count: number
  status: boolean
  is_select: boolean
  day_call: number
  version: string
  /** dashboard/LeftInfo 的 get_bot_list 响应额外携带 */
  platform?: string
  /** dashboard/LeftInfo 旧字段，可能不出现 */
  connectTime?: string
}
