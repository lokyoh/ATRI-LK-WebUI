<template>
  <div class="config-sections">
    <div class="sections-main">
      <el-collapse v-model="activeKeys">
        <el-collapse-item
          v-for="block in blocks"
          :key="block.key"
          :name="block.key"
          :ref="(el: unknown) => setBlockRef(block.key, el)"
        >
          <template #title>
            <div class="section-title">
              <span class="section-label">{{ block.label }}</span>
              <span class="section-count">{{ block.fields.length }} 项</span>
            </div>
            <p v-if="block.description" class="section-desc">{{ block.description }}</p>
          </template>
          <DictChildren
            :children="block.fields"
            :disabled="disabled"
            :json-drafts="jsonDrafts"
            :json-errors="jsonErrors"
            @field-change="(field, value) => emit('field-change', field, value)"
            @json-input="(path, value) => emit('json-input', path, value)"
            @json-blur="(path) => emit('json-blur', path)"
            @field-error="(path, error) => emit('field-error', path, error)"
          />
        </el-collapse-item>
      </el-collapse>
    </div>

    <nav v-if="blocks.length > 1" class="sections-nav" aria-label="配置分节导航">
      <button
        v-for="block in blocks"
        :key="block.key"
        type="button"
        :class="['nav-item', { active: activeKey === block.key }]"
        @click="jumpTo(block.key)"
      >
        {{ block.label }}
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DictChildren from '@/components/plugin/DictChildren.vue'
import type {
  PluginConfigField,
  PluginConfigSection,
} from '@/types/plugin-config'

defineOptions({ name: 'ConfigSections' })

interface Block {
  key: string
  label: string
  description: string
  fields: PluginConfigField[]
}

const props = withDefaults(
  defineProps<{
    sections: PluginConfigSection[]
    fields: PluginConfigField[]
    jsonDrafts: Record<string, string>
    jsonErrors: Record<string, string>
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{
  (event: 'field-change', field: PluginConfigField, value: unknown): void
  (event: 'json-input', path: string, value: string): void
  (event: 'json-blur', path: string): void
  (event: 'field-error', path: string, error: string | undefined): void
}>()

/** 没被任何分节认领的字段，统一放进「其他」，避免结构变了就静默丢字段。 */
const ORPHAN_KEY = '__orphan__'

const blocks = computed<Block[]>(() => {
  const byKey = new Map(props.fields.map((field) => [field.key, field]))
  const result: Block[] = []
  const claimed = new Set<string>()

  for (const section of props.sections) {
    const fields = section.keys
      .map((key) => byKey.get(key))
      .filter((field): field is PluginConfigField => Boolean(field))
    fields.forEach((field) => claimed.add(field.key))
    if (!fields.length) continue
    result.push({
      key: section.key,
      label: section.label,
      description: section.description,
      fields,
    })
  }

  const orphans = props.fields.filter((field) => !claimed.has(field.key))
  if (orphans.length) {
    result.push({
      key: ORPHAN_KEY,
      label: '其他',
      description: '',
      fields: orphans,
    })
  }
  return result
})

// 默认只展开第一块：Agent 现在 41 项，全展开等于没折叠。
const activeKeys = ref<string[]>([])
const activeKey = ref('')
const blockEls = new Map<string, HTMLElement>()
const scrollParent = ref<HTMLElement | null>(null)
let jumpLock = false
let jumpLockTimer = 0

watch(
  blocks,
  (value) => {
    const first = value[0]?.key ?? ''
    activeKeys.value = first ? [first] : []
    activeKey.value = first
  },
  { immediate: true },
)

function setBlockRef(key: string, el: unknown) {
  const root = ((el as { $el?: HTMLElement } | null)?.$el ?? el) as HTMLElement | undefined
  if (root) blockEls.set(key, root)
  else blockEls.delete(key)
}

function resolveScrollParent(): HTMLElement | null {
  let node = (blockEls.values().next().value as HTMLElement | undefined)?.parentElement
  while (node && node !== document.body) {
    const overflowY = getComputedStyle(node).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') return node
    node = node.parentElement
  }
  return null
}

/** 滚动高亮：取最后一个已滚到视口上方的分节。 */
function syncActiveOnScroll() {
  if (jumpLock) return
  const parent = scrollParent.value
  if (!parent) return
  const parentTop = parent.getBoundingClientRect().top
  let current = ''
  for (const block of blocks.value) {
    const el = blockEls.get(block.key)
    if (!el) continue
    if (el.getBoundingClientRect().top - parentTop <= 96) current = block.key
  }
  if (current) activeKey.value = current
}

function jumpTo(key: string) {
  if (!activeKeys.value.includes(key)) activeKeys.value = [...activeKeys.value, key]
  activeKey.value = key
  const el = blockEls.get(key)
  const parent = scrollParent.value
  if (!el || !parent) return
  // 末节滚不到顶：平滑滚动途中的位置会把高亮算到上一节，按点击目标锁一会儿。
  jumpLock = true
  window.clearTimeout(jumpLockTimer)
  jumpLockTimer = window.setTimeout(() => (jumpLock = false), 700)
  const offset = el.getBoundingClientRect().top - parent.getBoundingClientRect().top
  parent.scrollTo({ top: parent.scrollTop + offset - 12, behavior: 'smooth' })
}

onMounted(() => {
  scrollParent.value = resolveScrollParent() ?? document.scrollingElement as HTMLElement | null
  scrollParent.value?.addEventListener('scroll', syncActiveOnScroll, { passive: true })
})

onBeforeUnmount(() => {
  scrollParent.value?.removeEventListener('scroll', syncActiveOnScroll)
})
</script>

<style scoped>
.config-sections {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 156px;
  gap: 18px;
  align-items: start;
}

.sections-main {
  min-width: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.section-count {
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 500;
}

.section-desc {
  margin: 2px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
}

.sections-nav {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
  box-shadow: 0 6px 18px rgb(15 23 42 / 8%);
}

.nav-item {
  padding: 7px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  transition:
    color 0.18s ease,
    background-color 0.18s ease;
}

.nav-item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.nav-item.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

@media (max-width: 900px) {
  .config-sections {
    grid-template-columns: minmax(0, 1fr);
  }

  .sections-nav {
    display: none;
  }
}
</style>