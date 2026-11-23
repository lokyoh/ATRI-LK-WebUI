/** 系统维护页（备份 / 全局调度）与 Agent 记忆、埋点浏览的契约。 */

export interface BackupItem {
  name: string
  size: number
  mtime: number
}

export interface BackupOverview {
  items: BackupItem[]
  target_dir: string
  /** 保留份数，0 表示不轮转 */
  keep: number
  include_db: boolean
  directories: string[]
  auto_enabled: boolean
  /** 形如 04:30 */
  cron: string
}

export interface SchedulerJobInfo {
  service: string
  name: string
  trigger: string
  paused: boolean
  /** 下次执行时间；暂停时为 null */
  next_run: string | null
  job_id: string
}

export interface SchedulerJobKey {
  service: string
  name: string
}

export interface MemoryItem {
  id: number
  content: string
  /** 库里的重要度（已按增量衰减结算） */
  importance: number
  decay_rate: number
  emotion: number
  created_at: number
  last_accessed: number
  /** 归属会话；空表示全局 */
  chat_id: string
  /** 「self」是亚托莉自己，其余是账号 ID */
  subject: string
  consolidated: boolean
  expired: boolean
  valid_until: number
  embedding_model: string
}

export interface MemoryPage {
  total: number
  items: MemoryItem[]
  chats: string[]
  subjects: string[]
}

export interface MemoryStats {
  total: number
  self: number
  consolidated: number
  expired: number
  without_vector: number
  by_chat: Array<{ chat_id: string; count: number }>
}

export interface TelemetryCount {
  event: string
  count: number
}

export interface TelemetryValue {
  key: string
  count: number
}

export interface TelemetrySummary {
  files: string[]
  rows: number
  truncated: boolean
  events: TelemetryCount[]
  /** 按功能名统计的调用次数 */
  tool: TelemetryValue[]
  /** 插话判断的标签分布 */
  judge_tags: TelemetryValue[]
  /** 主动开口被拒的原因分布 */
  initiative_start: TelemetryValue[]
  turn: {
    turns?: number
    failed?: number
    avg_rounds?: number
    avg_duration?: number
  }
}
