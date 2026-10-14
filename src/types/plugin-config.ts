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
