<template>
  <div class="config-fields">
    <div v-for="field in children" :key="field.key" class="config-field">
      <template v-if="field.type === 'group'">
        <div class="group-heading">
          <div class="field-label">{{ field.label }}</div>
          <div v-if="field.description" class="field-description">{{ field.description }}</div>
        </div>
        <DictChildren
          :children="field.children || []"
          :path-prefix="fieldPath(field)"
          :disabled="disabled || !field.editable"
          :json-drafts="jsonDrafts"
          :json-errors="jsonErrors"
          @field-change="(changedField, value) => emit('field-change', changedField, value)"
          @json-input="(path, value) => emit('json-input', path, value)"
          @json-blur="(path) => emit('json-blur', path)"
          @field-error="(path, error) => emit('field-error', path, error)"
        />
      </template>

      <template v-else>
        <div class="field-heading">
          <div class="field-label">
            {{ field.label }}<span v-if="field.required" class="required-mark">*</span>
          </div>
          <div v-if="field.description" class="field-description">{{ field.description }}</div>
        </div>

        <div class="field-control">
          <MySwitch
            v-if="field.type === 'boolean'"
            :model-value="Boolean(field.value)"
            :disabled="disabled || !field.editable"
            @update:model-value="emit('field-change', field, $event)"
          />

          <el-select
            v-else-if="field.options?.length"
            :model-value="field.value as string | number"
            :disabled="disabled || !field.editable"
            :placeholder="field.itemField?.label || '请选择'"
            @update:model-value="emit('field-change', field, $event)"
          >
            <el-option
              v-for="option in field.options"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <el-input-number
            v-else-if="field.type === 'number'"
            :model-value="Number(field.value)"
            :min="field.min"
            :max="field.max"
            :step="1"
            :disabled="disabled || !field.editable"
            controls-position="right"
            @update:model-value="emit('field-change', field, $event)"
          />

          <div v-else-if="field.type === 'list'" class="list-editor">
            <div
              v-for="(item, index) in listValue(field)"
              :key="index"
              class="list-editor-row"
            >
              <MySwitch
                v-if="field.itemType === 'bool'"
                :model-value="Boolean(item)"
                :disabled="disabled || !field.editable"
                @update:model-value="updateListItem(field, index, $event)"
              />
              <el-input-number
                v-else-if="field.itemType === 'int' || field.itemType === 'float'"
                :model-value="Number(item)"
                :step="field.itemType === 'float' ? 0.1 : 1"
                :disabled="disabled || !field.editable"
                @update:model-value="updateListItem(field, index, $event)"
              />
              <el-input
                v-else
                :model-value="String(item ?? '')"
                :disabled="!field.editable"
                :placeholder="field.itemField?.label || '请输入'"
                @update:model-value="updateListItem(field, index, $event)"
              />
              <el-button
                v-if="field.editable && !disabled"
                type="danger"
                plain
                :icon="Delete"
                circle
                aria-label="删除列表项"
                @click="removeListItem(field, index)"
              />
            </div>
            <el-button
              v-if="field.editable && !disabled"
              class="config-add-button"
              type="primary"
              plain
              :icon="Plus"
              @click="addListItem(field)"
            >
              添加
            </el-button>
          </div>

          <div v-else-if="field.type === 'map-list'" class="map-list-editor">
            <div
              v-for="entry in mapEntries(field)"
              :key="entry.id"
              class="map-list-group"
            >
              <div class="map-list-group-header">
                <el-input
                  :model-value="entry.key"
                  :disabled="disabled || !field.editable"
                  :placeholder="field.keyField?.label || '键'"
                  :aria-label="field.keyField?.label || '键'"
                  @update:model-value="updateMapKey(field, entry.id, $event)"
                />
                <el-button
                  v-if="field.editable && !disabled"
                  type="danger"
                  plain
                  :icon="Delete"
                  circle
                  aria-label="删除此映射项"
                  @click="removeMapGroup(field, entry.id)"
                />
              </div>
              <template v-if="field.itemField?.type === 'list'">
                <div
                  v-for="(item, index) in mapListValue(entry)"
                  :key="index"
                  class="map-list-user"
                >
                  <el-select
                    v-if="mapListItemField(field)?.options?.length"
                    :model-value="item as string | number | boolean"
                    :disabled="disabled || !field.editable"
                    :placeholder="mapListItemField(field)?.label || '请选择'"
                    @update:model-value="updateMapUser(field, entry.id, index, $event)"
                  >
                    <el-option
                      v-for="option in mapListItemField(field)?.options"
                      :key="String(option.value)"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                  <MySwitch
                    v-else-if="mapListItemType(field) === 'bool' || mapListItemType(field) === 'boolean'"
                    :model-value="Boolean(item)"
                    :disabled="disabled || !field.editable"
                    @update:model-value="updateMapUser(field, entry.id, index, $event)"
                  />
                  <el-input-number
                    v-else-if="
                      mapListItemType(field) === 'int' ||
                      mapListItemType(field) === 'float' ||
                      mapListItemType(field) === 'number'
                    "
                      :model-value="Number(item)"
                      :step="mapListItemStep(field)"
                    :disabled="disabled || !field.editable"
                    @update:model-value="updateMapUser(field, entry.id, index, $event)"
                  />
                  <el-input
                    v-else
                    :model-value="String(item ?? '')"
                    :disabled="disabled || !field.editable"
                    :placeholder="mapListItemField(field)?.label || field.itemField.label || '请输入'"
                    :aria-label="mapListItemField(field)?.label || field.itemField.label"
                    @update:model-value="updateMapUser(field, entry.id, index, $event)"
                  />
                  <el-button
                    v-if="field.editable && !disabled"
                    type="danger"
                    plain
                    :icon="Delete"
                    circle
                    aria-label="删除列表项"
                    @click="removeMapUser(field, entry.id, index)"
                  />
                </div>
                <el-button
                  v-if="field.editable && !disabled"
                  class="config-add-button"
                  type="primary"
                  plain
                  :icon="Plus"
                  @click="addMapUser(field, entry.id)"
                >
                  添加{{ mapListItemField(field)?.label || field.itemField.label || '列表项' }}
                </el-button>
              </template>
              <el-select
                v-else-if="field.itemField?.options?.length"
                :model-value="entry.value as string | number | boolean"
                :disabled="disabled || !field.editable"
                :placeholder="field.itemField?.label || '请选择'"
                @update:model-value="updateMapValue(field, entry.id, $event)"
              >
                <el-option
                  v-for="option in field.itemField.options"
                  :key="String(option.value)"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              <MySwitch
                v-else-if="field.itemField?.type === 'boolean'"
                :model-value="Boolean(entry.value)"
                :disabled="disabled || !field.editable"
                @update:model-value="updateMapValue(field, entry.id, $event)"
              />
              <el-input-number
                v-else-if="field.itemField?.type === 'number'"
                :model-value="Number(entry.value ?? field.itemField.default)"
                :min="field.itemField.min"
                :max="field.itemField.max"
                :disabled="disabled || !field.editable"
                @update:model-value="updateMapValue(field, entry.id, $event)"
              />
              <el-input
                v-else-if="field.itemField?.type === 'string'"
                :model-value="String(entry.value ?? '')"
                :disabled="disabled || !field.editable"
                :placeholder="field.itemField?.label || '请输入'"
                @update:model-value="updateMapValue(field, entry.id, $event)"
              />
              <el-input
                v-else
                type="textarea"
                :model-value="formatJson(entry.value)"
                :disabled="disabled || !field.editable"
                :rows="3"
                spellcheck="false"
                @update:model-value="updateMapJsonValue(field, entry.id, $event)"
              />
            </div>
            <el-button
              v-if="field.editable && !disabled"
              class="config-add-button"
              type="primary"
              plain
              :icon="Plus"
              @click="addMapGroup(field)"
            >
              添加{{ field.keyField?.label || '键' }}
            </el-button>
          </div>

          <el-input
            v-else-if="field.type === 'json' || field.type === 'object-list'"
            type="textarea"
            :model-value="jsonDrafts[fieldPath(field)] ?? formatJson(field.value)"
            :disabled="disabled || !field.editable"
            :rows="4"
            spellcheck="false"
            @update:model-value="emit('json-input', fieldPath(field), $event)"
            @blur="emit('json-blur', fieldPath(field))"
          />

          <el-input
            v-else
            :model-value="String(field.value ?? '')"
            :disabled="disabled || !field.editable"
            :placeholder="field.required ? '必填' : '请输入'"
            @update:model-value="emit('field-change', field, $event)"
          />

          <div v-if="jsonErrors[fieldPath(field)]" class="field-error">
            {{ jsonErrors[fieldPath(field)] }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import MySwitch from '@/components/ui/MySwitch.vue'
import type { PluginConfigField } from '@/types/plugin-config'

defineOptions({ name: 'DictChildren' })

interface MapListEntry {
  id: number
  key: string
  value: unknown
}

const props = withDefaults(
  defineProps<{
    children: PluginConfigField[]
    pathPrefix?: string
    disabled?: boolean
    jsonDrafts: Record<string, string>
    jsonErrors: Record<string, string>
  }>(),
  { pathPrefix: '', disabled: false },
)

const emit = defineEmits<{
  (event: 'field-change', field: PluginConfigField, value: unknown): void
  (event: 'json-input', path: string, value: string): void
  (event: 'json-blur', path: string): void
  (event: 'field-error', path: string, error: string | undefined): void
}>()

const mapListDrafts = ref<Record<string, MapListEntry[]>>({})
let nextMapEntryId = 0

watch(
  () => props.children,
  () => {
    mapListDrafts.value = {}
    nextMapEntryId = 0
  },
)

function fieldPath(field: PluginConfigField): string {
  return props.pathPrefix ? `${props.pathPrefix}.${field.key}` : field.key
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? ''
}

function listValue(field: PluginConfigField): unknown[] {
  return Array.isArray(field.value) ? field.value : []
}

function updateListItem(field: PluginConfigField, index: number, value: unknown) {
  const list = [...listValue(field)]
  list[index] = value
  emit('field-change', field, list)
}

function addListItem(field: PluginConfigField) {
  const defaults: Record<string, unknown> = {
    bool: false,
    int: 0,
    float: 0,
    str: '',
    string: '',
  }
  emit('field-change', field, [...listValue(field), defaults[field.itemType || 'str'] ?? ''])
}

function removeListItem(field: PluginConfigField, index: number) {
  emit(
    'field-change',
    field,
    listValue(field).filter((_, itemIndex) => itemIndex !== index),
  )
}

function mapEntries(field: PluginConfigField): MapListEntry[] {
  const path = fieldPath(field)
  if (!mapListDrafts.value[path]) {
    const value = field.value
    const entries =
      value && typeof value === 'object' && !Array.isArray(value)
        ? Object.entries(value).map(([key, itemValue]) => ({
            id: nextMapEntryId++,
            key,
            value: itemValue,
          }))
        : []
    mapListDrafts.value[path] = entries
  }
  return mapListDrafts.value[path]
}

function updateMap(field: PluginConfigField) {
  const path = fieldPath(field)
  const entries = mapEntries(field)
  const seenKeys = new Set<string>()
  let error: string | undefined

  for (const entry of entries) {
    const key = entry.key.trim()
    const keyLabel = field.keyField?.label || '键'
    if (!key) {
      error = `请填写“${keyLabel}”`
      break
    }
    if (seenKeys.has(key)) {
      error = `“${keyLabel}”${key}重复`
      break
    }
    seenKeys.add(key)
    if (
      field.itemField?.type === 'list' &&
      (mapListItemType(field) === 'string' || mapListItemType(field) === 'str') &&
      mapListValue(entry).some((userId) => !String(userId).trim())
    ) {
      const itemLabel =
        mapListItemField(field)?.label || field.itemField.itemField?.label || field.itemField.label || '列表项'
      error = `“${keyLabel}”${key}下有空的“${itemLabel}”，请填写或删除`
      break
    }
  }

  emit('field-error', path, error)
  if (error) return

  emit(
    'field-change',
    field,
    Object.fromEntries(
      entries.map((entry) => [
        entry.key.trim(),
        entry.value,
      ]),
    ),
  )
}

function updateMapKey(field: PluginConfigField, id: number, key: string) {
  const entry = mapEntries(field).find((item) => item.id === id)
  if (!entry) return
  entry.key = key
  updateMap(field)
}

function mapListValue(entry: MapListEntry): unknown[] {
  return Array.isArray(entry.value) ? entry.value : []
}

function mapListItemField(field: PluginConfigField) {
  return field.itemField?.itemField
}

function mapListItemType(field: PluginConfigField): string | undefined {
  return mapListItemField(field)?.type ?? field.itemField?.itemType
}

function mapListItemStep(field: PluginConfigField): number {
  const itemField = mapListItemField(field)
  if (itemField?.type === 'number') {
    return Number.isInteger(itemField.default) ? 1 : 0.1
  }
  return mapListItemType(field) === 'float' ? 0.1 : 1
}

function cloneConfigValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(cloneConfigValue)
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, cloneConfigValue(nestedValue)]),
    )
  }
  return value
}

function updateMapValue(field: PluginConfigField, id: number, value: unknown) {
  const entry = mapEntries(field).find((item) => item.id === id)
  if (!entry) return
  entry.value = value
  updateMap(field)
}

function updateMapJsonValue(field: PluginConfigField, id: number, draft: string) {
  const entry = mapEntries(field).find((item) => item.id === id)
  if (!entry) return
  try {
    entry.value = JSON.parse(draft) as unknown
    updateMap(field)
  } catch {
    const keyLabel = field.keyField?.label || '键'
    emit('field-error', fieldPath(field), `“${keyLabel}”${entry.key || '未填写'}的配置不是有效 JSON`)
  }
}

function updateMapUser(field: PluginConfigField, id: number, index: number, value: unknown) {
  const entry = mapEntries(field).find((item) => item.id === id)
  if (!entry) return
  const values = mapListValue(entry)
  values[index] = value
  entry.value = values
  updateMap(field)
}

function addMapGroup(field: PluginConfigField) {
  const defaultValue = field.itemField?.default ?? []
  const value = cloneConfigValue(defaultValue)
  mapEntries(field).push({ id: nextMapEntryId++, key: '', value })
  updateMap(field)
}

function removeMapGroup(field: PluginConfigField, id: number) {
  mapListDrafts.value[fieldPath(field)] = mapEntries(field).filter((entry) => entry.id !== id)
  updateMap(field)
}

function addMapUser(field: PluginConfigField, id: number) {
  const entry = mapEntries(field).find((item) => item.id === id)
  if (!entry) return
  const itemField = field.itemField?.itemField
  const itemType = field.itemField?.itemType
  const defaults: Record<string, unknown> = {
    bool: false,
    int: 0,
    float: 0,
    str: '',
  }
  const value =
    itemField !== undefined
      ? cloneConfigValue(itemField.default)
      : defaults[itemType ?? 'str'] ?? ''
  entry.value = [...mapListValue(entry), value]
  updateMap(field)
}

function removeMapUser(field: PluginConfigField, id: number, index: number) {
  const entry = mapEntries(field).find((item) => item.id === id)
  if (!entry) return
  entry.value = mapListValue(entry).filter((_, itemIndex) => itemIndex !== index)
  updateMap(field)
}
</script>

<style lang="scss" scoped>
.config-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-field {
  display: grid;
  grid-template-columns: minmax(130px, 1fr) minmax(0, 1.6fr);
  align-items: start;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 8px;
  background: var(--el-bg-color-overlay, #fff);
}

.group-heading {
  grid-column: 1 / -1;
}

.group-heading + .config-fields {
  grid-column: 1 / -1;
  padding-left: 12px;
  border-left: 2px solid var(--el-color-primary, #409eff);
}

.field-label {
  color: var(--el-text-color-primary, #303133);
  font-size: 13px;
  font-weight: 600;
}

.required-mark,
.field-error {
  color: var(--el-color-danger, #f56c6c);
}

.required-mark {
  margin-left: 3px;
}

.field-description {
  margin-top: 3px;
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
  line-height: 1.5;
}

.field-control {
  min-width: 0;
}

.field-control :deep(.el-select),
.field-control :deep(.el-input-number),
.field-control :deep(.el-input) {
  width: 100%;
}

.list-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-editor-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.list-editor-row :deep(.el-input-number) {
  flex: 1;
}

.map-list-editor,
.map-list-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.map-list-group {
  padding: 10px;
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 8px;
}

.map-list-group-header,
.map-list-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-list-group-header :deep(.el-input),
.map-list-user :deep(.el-input) {
  flex: 1;
}

.config-add-button {
  align-self: flex-start;
}

.field-error {
  margin-top: 4px;
  font-size: 12px;
}

@media (max-width: 640px) {
  .config-field {
    grid-template-columns: 1fr;
  }
}
</style>
