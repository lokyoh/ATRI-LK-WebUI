<template>
  <div class="svg-icon" :style="{ width: size + 'px', height: size + 'px' }" v-html="svgContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 预加载所有 SVG 文件
const svgModules = import.meta.glob('@/assets/icons/svg/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
})

interface Props {
  name: string
  size?: number | string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  color: 'currentColor'
})

const svgContent = computed(() => {
  const path = `/src/assets/icons/svg/${props.name}.svg`
  const module = svgModules[path]
  if (module) {
    let content = module as string
    // 替换现有的 fill 和 stroke 属性
    content = content.replace(/fill="[^"]*"/g, `fill="${props.color}"`)
    content = content.replace(/stroke="[^"]*"/g, `stroke="${props.color}"`)
    // 为没有 fill 的 path 添加 fill
    content = content.replace(/<path([^>]*?)>/g, `<path$1 fill="${props.color}">`)
    return content
  }
  return ''
})
</script>

<style scoped>
.svg-icon {
  display: inline-block;
  flex-shrink: 0;
}

.svg-icon :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
