<template>
  <div class="moe-input-container">
    <div class="input-wrapper">
      <el-input v-model="innerValue" :placeholder="placeholder" class="moe-el-input"
        :class="{ 'is-focused': isFocused }" @focus="handleFocus" @blur="handleBlur" @input="handleInput" :type="type">
        <template v-if="prefixIcon" #prefix>
          <i :class="prefixIcon" class="input-icon"></i>
        </template>
        <template v-if="suffixIcon" #suffix>
          <i :class="suffixIcon" class="input-icon"></i>
        </template>
      </el-input>
      <div class="soft-pink-overlay"></div>
      <div class="border-highlight" :class="{ 'is-active': isFocused }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"

interface Props {
  value?: string | number
  placeholder?: string
  prefixIcon?: string
  suffixIcon?: string
  type?: string
}

const props = withDefaults(defineProps<Props>(), {
  value: "",
  placeholder: "",
  prefixIcon: "",
  suffixIcon: "",
  type: "text",
})

const emit = defineEmits<{
  (e: "input", value: string | number): void
  (e: "focus", event: FocusEvent): void
  (e: "blur", event: FocusEvent): void
}>()

const isFocused = ref(false)
const innerValue = ref<string | number>(props.value)

watch(
  () => props.value,
  (newVal) => {
    innerValue.value = newVal
  }
)

function handleInput(value: string | number) {
  emit("input", value)
}

function handleFocus(e: FocusEvent) {
  isFocused.value = true
  emit("focus", e)
}

function handleBlur(e: FocusEvent) {
  isFocused.value = false
  emit("blur", e)
}
</script>

<style lang="scss" scoped>
.moe-input-container {
  position: relative;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;

  .input-wrapper {
    position: relative;
  }

  .soft-pink-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 0.5rem;
    pointer-events: none;
    background: linear-gradient(120deg,
        var(--primary-color-light-9),
        var(--primary-color-light-8));
    opacity: 0.3;
    z-index: 0;
  }

  .border-highlight {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 0.5rem;
    pointer-events: none;
    background: var(--primary-color-light-7);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;

    &.is-active {
      opacity: 1;
    }
  }
}

.moe-el-input :deep(.el-input__inner) {
  padding-right: 2rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background-color: var(--bg-color-secondary);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  box-shadow: var(--el-box-shadow-lighter);
  padding: 0px 30px !important;
}

.moe-el-input :deep(.el-input__inner):hover {
  border-color: var(--primary-color-light);
  box-shadow: var(--el-box-shadow-light);
}

.moe-el-input :deep(.el-input__inner):focus {
  box-shadow: 0 0 0 2px var(--primary-color-light-9);
  border-color: var(--primary-color) !important;
}

.moe-el-input :deep(.el-input__inner)::placeholder {
  color: var(--text-color-placeholder);
}

.moe-el-input :deep(.el-input__prefix) {
  left: 0.5rem;
  display: flex;
  align-items: center;
  color: var(--primary-color);
}

.moe-el-input :deep(.el-input__suffix) {
  right: 0.5rem;
  display: flex;
  align-items: center;
  color: var(--text-color-secondary);
}

.moe-el-input.is-focused :deep(.el-input__inner) {
  background-color: var(--bg-color-secondary);
  box-shadow: var(--el-box-shadow-light);
  border-color: var(--primary-color) !important;
}

.input-icon {
  color: var(--primary-color);
  transition: color 0.3s ease;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .moe-el-input :deep(.el-input__inner) {
    height: 2.25rem;
    font-size: 0.875rem;
    padding: 0px 24px !important;
  }

  .moe-el-input :deep(.el-input__prefix),
  .moe-el-input :deep(.el-input__suffix) {
    font-size: 0.875rem;
  }
}
</style>
