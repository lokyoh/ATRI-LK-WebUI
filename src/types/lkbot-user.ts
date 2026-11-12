/** lkbot 用户（/lkbot/get_users 返回的单条） */
export interface LkUserInfo {
  /** 账号 ID */
  id: string
  /** lkbot 里登记的名称 */
  name: string
  /** 等级（由经验换算） */
  level: number
  /** 当前总经验 */
  exp: number
  /** 升到下一级还差多少 */
  left_exp: number
  /** ATRI 币 */
  money: number
  /** 好感度 */
  love: number
  /** 累计签到天数 */
  signdays: number
  /** 最后一次签到的日期 */
  lastsign: string
  /** 是否为主人（绑定到主人的账号解析后也算） */
  is_master: boolean
  /** 如果账号绑定到其他账号，这里是最终主账号 */
  bound_to: string
}

/** 账号绑定：小号 → 主账号 */
export interface LkBindingInfo {
  account_id: string
  master_id: string
  master_name: string
}

/** 背包里的一格 */
export interface LkBackpackItem {
  /** 物品名 */
  name: string
  /** 物品种类，如「工具」「道具」 */
  type: string
  /** 数量 */
  num: number
  /** 额外数据（如工具耐久） */
  extra: Record<string, unknown>
}

/** 单个用户详情 */
export interface LkUserDetail extends LkUserInfo {
  /** 这个账号绑定了哪些小号（仅本身是主账号时有内容） */
  bindings: LkBindingInfo[]
  /** 背包内容 */
  backpack: LkBackpackItem[]
}

/** 物品目录里的一条 */
export interface LkItemCatalogEntry {
  name: string
  type: string
}

/** /lkbot/get_item_catalog 返回 */
export interface LkItemCatalog {
  items: LkItemCatalogEntry[]
  types: string[]
}

export interface BindAccountPayload {
  account_id: string
  master_id: string
}
