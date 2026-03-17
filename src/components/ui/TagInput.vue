<template>
  <div class="tag-input" :class="{ 'is-focus': isFocus }">
    <div class="tag-input__container">
      <!-- 标签列表 -->
      <div v-for="(tag, index) in tags" :key="index" class="tag-input__tag">
        <span class="tag-input__tag-text">{{ tag }}</span>
        <i class="tag-input__tag-close" @click="removeTag(index)">✕</i>
      </div>

      <!-- 输入框 -->
      <input ref="inputRef" v-model="inputValue" type="text" class="tag-input__field"
        :placeholder="tags.length === 0 ? placeholder : ''" @keydown.delete="handleDelete"
        @keydown.enter.prevent="addTag" @focus="handleFocus" @blur="handleBlur" />
    </div>

    <!-- 添加按钮 -->
    <button v-if="inputValue.trim()" type="button" class="tag-input__add-btn" @click="addTag" tabindex="-1">
      <i class="el-icon-plus"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue?: string[]
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  placeholder: '输入后按回车或点击 + 号添加',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const tags = ref<string[]>([...props.modelValue])
const inputValue = ref('')
const isFocus = ref(false)
const inputRef = ref<HTMLInputElement>()

watch(() => props.modelValue, (newVal) => {
  tags.value = [...newVal]
}, { deep: true })

function addTag() {
  const value = inputValue.value.trim()
  if (value && !tags.value.includes(value)) {
    tags.value.push(value)
    emit('update:modelValue', tags.value)
  }
  inputValue.value = ''
}

function removeTag(index: number) {
  tags.value.splice(index, 1)
  emit('update:modelValue', tags.value)
  inputRef.value?.focus()
}

function handleDelete() {
  if (!inputValue.value && tags.value.length > 0) {
    tags.value.pop()
    emit('update:modelValue', tags.value)
  }
}

function handleFocus() {
  isFocus.value = true
}

function handleBlur() {
  isFocus.value = false
  // 失焦时如果有输入也添加
  if (inputValue.value.trim()) {
    addTag()
  }
}
</script>

<style lang="scss" scoped>
$primary: var(--el-color-primary, #409eff);
$primary-light: var(--el-color-primary-light-7, #c6e2ff);
$border: var(--el-border-color, #dcdfe6);
$text: var(--el-text-color-regular, #606266);
$bg: var(--el-bg-color, #ffffff);

.tag-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid $border;
  border-radius: 4px;
  background: $bg;
  transition: all 0.3s ease;
  min-height: 40px;

  &.is-focus {
    border-color: $primary;
    box-shadow: 0 0 0 2px $primary-light;
  }

  &__container {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    background: $primary-light;
    color: $primary;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.5;
    animation: tagIn 0.2s ease;

    @keyframes tagIn {
      from {
        opacity: 0;
        transform: scale(0.8);
      }

      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    &-text {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-close {
      margin-left: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: opacity 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 12px;
      height: 12px;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  &__field {
    flex: 1;
    min-width: 100px;
    border: none;
    outline: none;
    font-size: 14px;
    color: $text;
    background: transparent;
    padding: 4px 0;

    &::placeholder {
      color: var(--el-text-color-placeholder, #a8abb2);
    }
  }

  &__add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 4px;
    background: $primary;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;

    i {
      font-size: 16px;
    }

    &:hover {
      background: var(--el-color-primary-light-3, #79bbff);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &:hover:not(.is-focus) {
    border-color: var(--el-color-primary-light-5, #90ccff);
  }
}
</style>
