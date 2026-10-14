<template>
  <div
    :class="[
      'my-button-container',
      customClass,
      disabled || loading
        ? 'opacity-70 cursor-not-allowed'
        : 'transform hover:scale-102 active:scale-98',
      `button-size-${size}`,
    ]"
    :style="{
      width: computedWidth,
      height: computedHeight,
    }"
  >
    <el-tooltip
      v-if="content"
      effect="light"
      :content="content"
      placement="top"
      popper-class="button-tooltip"
    >
      <button
        :type="nativeType"
        class="button-class"
        :class="[
          typeClass,
          roundedClass,
          shadowClass,
          disabled || loading ? 'pointer-events-none' : '',
          glowEffect,
        ]"
        @click="handleClick"
        :disabled="disabled || loading"
        :style="{
          '--button-bg-color': getButtonColor(),
          '--button-hover-color': getButtonHoverColor(),
          '--button-border-color': getButtonBorderColor(),
          '--button-text-color':
            type === 'default'
              ? 'var(--el-text-color-primary)'
              : 'var(--button-icon-color-primary)',
        }"
      >
        <span class="button-content">
          <el-icon v-if="loading" class="is-loading">
            <SvgIcon name="loading" class="animate-spin" :color="getIconColor()" />
          </el-icon>
          <SvgIcon
            v-else-if="icon"
            :name="icon"
            class="button-icon"
            :color="getIconColor()"
            :size="getIconSize()"
          />
          <span
            class="button-text"
            :style="{
              fontSize: `${getFontSize()}px`,
            }"
            >{{ text }}</span
          >
        </span>
        <div class="button-background"></div>
      </button>
    </el-tooltip>

    <button
      v-else
      :type="nativeType"
      class="button-class"
      :class="[
        typeClass,
        roundedClass,
        shadowClass,
        disabled || loading ? 'pointer-events-none' : '',
        glowEffect,
      ]"
      @click="handleClick"
      :disabled="disabled || loading"
      :style="{
        '--button-bg-color': getButtonColor(),
        '--button-hover-color': getButtonHoverColor(),
        '--button-border-color': getButtonBorderColor(),
        '--button-text-color':
          type === 'default' ? 'var(--el-text-color-primary)' : 'var(--button-icon-color-primary)',
      }"
    >
      <span class="button-content">
        <el-icon v-if="loading" class="is-loading">
          <SvgIcon name="loading" class="animate-spin" :color="getIconColor()" />
        </el-icon>
        <SvgIcon
          v-else-if="icon"
          :name="icon"
          class="button-icon"
          :color="getIconColor()"
          :size="getIconSize()"
        />
        <span
          class="button-text"
          :style="{
            fontSize: `${getFontSize()}px`,
          }"
          >{{ text }}</span
        >
      </span>
      <div class="button-background"></div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import SvgIcon from '../SvgIcon/SvgIcon.vue'

interface Props {
  text?: string
  icon?: string
  content?: string
  iconSize?: number | string
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'small' | 'default' | 'large'
  width?: number | string
  height?: number | string
  disabled?: boolean
  fontSize?: number | string
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
  loading?: boolean
  nativeType?: 'button' | 'submit' | 'reset'
  customClass?: string
  iconColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  icon: '',
  content: '',
  iconSize: 20,
  type: 'default',
  size: 'default',
  width: 0,
  height: 40,
  disabled: false,
  fontSize: 14,
  rounded: 'full',
  shadow: 'md',
  glow: false,
  loading: false,
  nativeType: 'button',
  customClass: '',
  iconColor: '',
})

const emit = defineEmits<{
  (e: 'click', event: Event): void
}>()

// 验证 props
if (props.text && props.text.length > 20) {
  console.warn('MyButton: text length should not exceed 20 characters')
}

const buttonSize = computed(() => {
  const sizes = {
    small: {
      height: 32,
      fontSize: 12,
      iconSize: 16,
    },
    default: {
      height: 40,
      fontSize: 14,
      iconSize: 20,
    },
    large: {
      height: 48,
      fontSize: 16,
      iconSize: 24,
    },
  }
  return sizes[props.size] || sizes.default
})

const sizeData = ref({
  iconWidth: Number(props.iconSize) || buttonSize.value.iconSize,
  iconHeight: Number(props.iconSize) || buttonSize.value.iconSize,
  fontSize: Number(props.fontSize) || buttonSize.value.fontSize,
  width: Number(props.width),
  height: Number(props.height),
})

const computedWidth = computed(() => {
  return sizeData.value.width === 0 ? '100%' : `${sizeData.value.width}px`
})

const computedHeight = computed(() => {
  return sizeData.value.height === 0 ? '100%' : `${sizeData.value.height}px`
})

const typeClass = computed(() => `button-variant-${props.type}`)

const roundedClass = computed(() => {
  return {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[props.rounded]
})

const shadowClass = computed(() => {
  return {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  }[props.shadow]
})

const glowEffect = computed(() => {
  if (!props.glow || props.disabled) return ''

  const glowColors: Record<string, string> = {
    default: 'hover:shadow-border-color',
    primary: 'hover:shadow-primary-color-light',
    success: 'hover:shadow-success-color-light',
    warning: 'hover:shadow-warning-color-light',
    danger: 'hover:shadow-danger-color-light',
    info: 'hover:shadow-info-color-light',
  }

  return `transition-shadow duration-300 ${
    glowColors[props.type] || glowColors.default
  } hover:shadow-lg`
})

const handleResize = () => {
  sizeData.value = {
    iconWidth: getIconSize(),
    iconHeight: getIconSize(),
    fontSize: getFontSize(),
    width: Number(props.width),
    height: Number(props.height),
  }
}

const handleClick = (event: Event) => {
  if (!props.disabled) {
    emit('click', event)
  }
}

const getButtonColor = () => {
  const colors: Record<string, string> = {
    default: 'var(--el-bg-color)',
    primary: 'var(--el-color-primary)',
    success: 'var(--el-color-success)',
    warning: 'var(--el-color-warning)',
    danger: 'var(--el-color-danger)',
    info: 'var(--el-color-info)',
  }
  return colors[props.type] || colors.default
}

const getButtonHoverColor = () => {
  const colors: Record<string, string> = {
    default: 'var(--el-fill-color-light)',
    primary: 'var(--primary-color-light)',
    success: 'var(--success-color-light)',
    warning: 'var(--warning-color-light)',
    danger: 'var(--danger-color-light)',
    info: 'var(--info-color-light)',
  }
  return colors[props.type] || colors.default
}

const getButtonBorderColor = () => {
  const colors: Record<string, string> = {
    default: 'var(--el-border-color)',
    primary: 'var(--primary-color-light-7)',
    success: 'var(--success-color-light)',
    warning: 'var(--warning-color-light)',
    danger: 'var(--danger-color-light)',
    info: 'var(--info-color-light)',
  }
  return colors[props.type] || colors.default
}

const getIconColor = () => {
  if (props.iconColor) {
    return props.iconColor
  }
  if (props.disabled) {
    return 'var(--el-text-color-disabled)'
  }
  if (props.type === 'default') {
    return 'var(--el-text-color-primary)'
  }
  if (props.loading) {
    return 'var(--el-color-primary)'
  }
  return '#ffffff'
}

const getIconSize = () => {
  if (props.iconSize) {
    return Number(props.iconSize)
  }
  return buttonSize.value.iconSize
}

const getFontSize = () => {
  if (props.fontSize) {
    return Number(props.fontSize)
  }
  return buttonSize.value.fontSize
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.my-button-container {
  position: relative;
  display: inline-flex;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.button-class {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: v-bind('sizeData.fontSize + "px"');
  color: var(--button-text-color);
  background-color: var(--button-bg-color);
  border: 1px solid var(--button-border-color);

  &:hover:not(:disabled) {
    background-color: var(--button-hover-color);
  }

  &:active:not(:disabled) {
    filter: brightness(0.96);
  }

  &:not(:disabled) {
    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--el-box-shadow);
    }

    &:active {
      transform: translateY(1px);
      box-shadow: var(--el-box-shadow-lighter);
    }
  }

  &:disabled {
    opacity: 0.7;
    background-color: var(--el-fill-color-light);
    border-color: var(--el-border-color-light);
    color: var(--el-text-color-disabled);
  }
}

.button-content {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.button-icon {
  width: v-bind('sizeData.iconWidth + "px"');
  height: v-bind('sizeData.iconHeight + "px"');
  transition: transform 0.3s ease;
}

.button-text {
  white-space: nowrap;
  font-weight: 500;
  letter-spacing: 0.025em;
}

.button-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(
    45deg,
    transparent 25%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 75%
  );
  background-size: 200% 200%;
  transition: all 0.3s ease;
  opacity: 0;
}

.button-class:not(:disabled):hover {
  .button-background {
    opacity: 1;
    animation: shimmer 2s infinite;
  }

  .button-icon {
    transform: scale(1.1) rotate(5deg);
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 200%;
  }

  100% {
    background-position: -200% -200%;
  }
}

/* 按钮尺寸样式 */
.button-size-small {
  .button-class {
    padding: 0.375rem 0.75rem;
  }

  .button-content {
    gap: 0.375rem;
  }
}

.button-size-default {
  .button-class {
    padding: 0.5rem 1rem;
  }

  .button-content {
    gap: 0.5rem;
  }
}

.button-size-large {
  .button-class {
    padding: 0.625rem 1.25rem;
  }

  .button-content {
    gap: 0.625rem;
  }
}

/* 加载状态样式 */
.is-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  .animate-spin {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 响应式调整 */
@media (max-width: 640px) {
  .button-size-small {
    .button-class {
      padding: 0.25rem 0.5rem;
    }

    .button-content {
      gap: 0.25rem;
    }
  }

  .button-size-default {
    .button-class {
      padding: 0.375rem 0.75rem;
    }

    .button-content {
      gap: 0.375rem;
    }
  }

  .button-size-large {
    .button-class {
      padding: 0.5rem 1rem;
    }

    .button-content {
      gap: 0.5rem;
    }
  }
}
</style>
