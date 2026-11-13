export type PluginConfigValue =
  | boolean
  | number
  | string
  | unknown[]
  | Record<string, unknown>
  | null

export interface PluginConfigField {
  key: string
  label: string
  description: string
  type:
    | 'boolean'
    | 'number'
    | 'string'
    | 'list'
    | 'json'
    | 'group'
    | 'object-list'
    | 'map-list'
    | 'category-collection'
    | string
  value: PluginConfigValue
  editable: boolean
  required: boolean
  options?: Array<{ label: string; value: unknown }>
  min?: number
  max?: number
  itemType?: string
  itemField?: PluginConfigItemField
  keyField?: PluginConfigItemField
  children?: PluginConfigField[]
  /** 分类集合：用作分类显示名的 item 子字段 key */
  categoryLabel?: string
  /** 分类集合：固定分类键，顺序即展示顺序 */
  fixedKeys?: string[]
  /** 分类集合：是否允许新增分类 */
  allowAdd?: boolean
  /** 分类集合：是否允许删除分类 */
  allowRemove?: boolean
  /** 分类集合：分类键的称呼，如「用户 ID」 */
  keyLabel?: string
  /** 分类集合：分类数量上限 */
  maxItems?: number
  /** 分类集合：后端校验规则的文字说明（仅提示，不参与前端校验） */
  validationHint?: string
}

export interface PluginConfigItemField {
  type: string
  default: unknown
  label: string
  description: string
  editable: boolean
  required: boolean
  itemType?: string
  itemField?: PluginConfigItemField
  options?: Array<{ label: string; value: unknown }>
  min?: number
  max?: number
  children?: PluginConfigField[]
}

export interface PluginConfigSchema {
  schemaVersion: string
  type: string
  service: string
  fields: PluginConfigField[]
}
