<template>
  <div class="moe-select-container w-full">
    <el-select v-model="selectedValue" :placeholder="placeholder" :popper-class="`moe-select-dropdown ${popperClass}`"
      class="moe-el-select w-full" :class="{ 'is-focused': isDropdownVisible }" @change="handleChange"
      @visible-change="handleVisibleChange" @focus="handleFocus" @blur="handleBlur" :clearable="clearable">
      <template #prefix>
        <i class="i-mdi-heart-outline text-pink-400 mr-1"></i>
      </template>

      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"
        class="moe-select-option">
        <div class="flex items-center">
          <i class="i-mdi-star-outline text-pink-300 mr-2" v-if="!isSelected(item)"></i>
          <i class="i-mdi-star text-yellow-400 mr-2" v-else></i>
          <span class="flex-1">{{ item.label }}</span>
          <i class="i-mdi-check text-pink-400 ml-2" v-if="isSelected(item)"></i>
        </div>
      </el-option>
    </el-select>

    <div class="soft-pink-overlay"></div>
    <div class="border-highlight" :class="{ 'is-active': isDropdownVisible }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"

interface SelectOption {
  value: string | number | object
  label: string
}

interface Props {
  value?: string | number | object | null
  options: SelectOption[]
  placeholder?: string
  popperClass?: string
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  placeholder: "请选择~",
  popperClass: "",
  clearable: false,
})

const emit = defineEmits<{
  (e: "input", value: string | number | object): void
  (e: "change", value: string | number | object): void
  (e: "focus"): void
  (e: "blur"): void
}>()

const selectedValue = ref<string | number | object | null>(props.value)
const isDropdownVisible = ref(false)

function handleChange(value: string | number | object) {
  emit("input", value)
  emit("change", value)
}

function handleVisibleChange(visible: boolean) {
  isDropdownVisible.value = visible
}

function handleFocus() {
  emit("focus")
}

function handleBlur() {
  emit("blur")
}

function isSelected(option: SelectOption): boolean {
  return option.value === selectedValue.value
}

watch(
  () => props.value,
  (newVal) => {
    selectedValue.value = newVal
  }
)
</script>

<style lang="scss" scoped>
.moe-select-container {
  position: relative;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;

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

.moe-el-select :deep(.el-input__inner) {
  padding-left: 2rem;
  padding-right: 2rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background-color: var(--bg-color-secondary);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  box-shadow: var(--el-box-shadow-lighter);
}

.moe-el-select :deep(.el-input__inner):hover {
  border-color: var(--primary-color-light);
}

.moe-el-select :deep(.el-input__inner):focus {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px var(--primary-color-light-9);
}

.moe-el-select :deep(.el-input__inner)::placeholder {
  color: var(--text-color-placeholder);
}

.moe-el-select :deep(.el-input__prefix) {
  left: 0.5rem;
  display: flex;
  align-items: center;
  color: var(--primary-color);
}

.moe-el-select :deep(.el-input__suffix) {
  right: 0.5rem;
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
  color: var(--text-color-secondary);
}

.moe-el-select.is-focused :deep(.el-input__inner) {
  border-color: var(--primary-color);
  box-shadow: var(--el-box-shadow-light);
}

.moe-el-select.is-focused :deep(.el-input__suffix) {
  transform: rotate(180deg);
}
</style>

<style lang="scss">
.moe-select-dropdown {
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  box-shadow: var(--el-box-shadow-light);
  max-height: 300px !important;
}

.moe-select-dropdown :deep(.el-select-dropdown__item) {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  color: var(--text-color);
  transition: all 0.2s ease;
  height: auto;
}

.moe-select-dropdown :deep(.el-select-dropdown__item):hover {
  background-color: var(--bg-color-hover);
  color: var(--primary-color);
}

.moe-select-dropdown :deep(.el-select-dropdown__item).selected {
  background-color: var(--primary-color-light-9);
  color: var(--primary-color);
  font-weight: 500;
}
</style>

<style scoped>
.select-container {
  position: relative;
  width: 100%;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-trigger:hover {
  border-color: var(--primary-color-light);
}

.select-trigger:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.select-placeholder {
  color: var(--text-color-placeholder);
}

.select-value {
  color: var(--text-color);
}

.select-arrow {
  color: var(--text-color-secondary);
  transition: transform 0.3s ease;
}

.select-arrow.open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background-color: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  box-shadow: var(--el-box-shadow-light);
  z-index: 1000;
  max-height: 15rem;
  overflow-y: auto;
}

.select-option {
  padding: 0.75rem 1rem;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-option:hover {
  background-color: var(--bg-color-hover);
}

.select-option.selected {
  background-color: var(--el-color-primary-light-9);
  color: var(--primary-color);
}

.select-option.disabled {
  color: var(--text-color-disabled);
  cursor: not-allowed;
}

.select-search {
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color-light);
}

.select-search input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.select-search input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.select-empty {
  padding: 1rem;
  text-align: center;
  color: var(--text-color-secondary);
}
</style>
