import { inject, markRaw, ref } from 'vue'
import EventBus from '@/utils/event-bus'
import { MagicStick, Moon, Monitor, Sunny } from '@element-plus/icons-vue'

interface ThemeOption {
  value: string
  label: string
  icon: unknown
  color: string
}

const themes: ThemeOption[] = [
  { value: 'pink', label: '可爱少女', icon: markRaw(MagicStick), color: '#F59E0B' },
  { value: 'dark', label: '暗黑模式', icon: markRaw(Moon), color: '#6B7280' },
  { value: 'light', label: '亮色模式', icon: markRaw(Sunny), color: '#F59E0B' },
  { value: 'one-dark', label: 'One Dark', icon: markRaw(Monitor), color: '#7C3AED' },
]

// 模块级共享：主题色被侧边栏图标、页首等多处消费，一处更新处处生效
const primaryColor = ref('')
let initialized = false

/**
 * 主题管理：主题列表、主题色读取与切换。
 * setAppTheme 由 App.vue provide。
 */
export function useTheme() {
  const setAppTheme = inject<(theme: string) => void>('setAppTheme')

  if (!initialized) {
    initialized = true
    updatePrimaryColor()
  }

  function updatePrimaryColor() {
    const style = getComputedStyle(document.documentElement)
    primaryColor.value = style.getPropertyValue('--primary-color').trim()
  }

  function handleThemeChange(command: string) {
    if (typeof setAppTheme === 'function') {
      setAppTheme(command)
      updatePrimaryColor()
      EventBus.emit('change-theme', {
        timestamp: Date.now(),
      })
    } else {
      console.error('setAppTheme function not provided/injected correctly.')
    }
  }

  return { themes, primaryColor, updatePrimaryColor, handleThemeChange }
}
