/** Agent 定时任务（/agent/get_tasks 返回的单条） */
export interface AgentTaskInfo {
  /** 任务 id（12 位十六进制） */
  id: string
  /** 任务名（用户描述，超长会截到 30 字） */
  name: string
  /** once / cron / interval */
  kind: string
  /** 类型的中文说法，如「一次性」「每天」 */
  kind_label: string
  /** 到点时给她自己看的提醒内容 */
  message: string
  /** 目标会话（群号 / group_openid） */
  chat_id: string
  /** 创建它的那个 bot。空表示无去向，到点不会执行 */
  bot_id: string
  /** 委托人 */
  user_id: string
  /** 触发时间的人话描述，如「9 分钟后」「每天 08:00」 */
  when: string
  /** 一次性任务的触发时间戳（UTC 秒） */
  run_at: number
  /** 周期任务的触发器参数 */
  spec: Record<string, unknown>
  /** 创建时间戳（UTC 秒） */
  created_at: number
}
