/** /agent/get_life 返回的日程、位置、穿搭与家 */

/** 一条日程 */
export interface ScheduleEntryInfo {
  /** HH:MM */
  start: string
  /** HH:MM；跨零点时会比 start 小 */
  end: string
  /** stay / travel */
  kind: string
  activity: string
  place: string
  from_place: string
  to_place: string
  /** routine / fill / go */
  source: string
  /** auto = 自动补的路程；carried = 前一天跨过零点的尾巴 */
  note: string
  /** 跨天遗留条目的真实开始时间（start 只是当天那段的 00:00） */
  origin_start: string
}

/** 此刻的位置（由日程实时派生） */
export interface LocationInfo {
  place: string
  activity: string
  moving: boolean
  from_place: string
  to_place: string
  since: string
  until: string
  eta_minutes: number
  /** 渲染好的自然语言 */
  text: string
}

export interface OutfitInfo {
  date: string
  day: string
  night: string
  current: string
}

/** 写日程时提交的一条；字段与后端 ScheduleEntry 一致 */
export interface ScheduleEntryInput {
  start: string
  end: string
  kind?: string
  activity: string
  place?: string
  from?: string
  to?: string
}
