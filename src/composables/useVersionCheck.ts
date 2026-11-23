import { inject, ref } from 'vue'
import { message } from '@/utils/message'
import { getRequest, postRequest } from '@/utils/api'
import { ElMessageBox } from 'element-plus'

interface VersionInfo {
  current: string
  current_name: string
  latest?: string | null
  has_update?: boolean
  update_time?: string | null
  notes?: string | null
  error?: string | null
}

/**
 * 版本检查与更新：页首「检查更新 / 立即更新」按钮的完整逻辑。
 */
export function useVersionCheck() {
  const prefix = inject<string>('prefix', '/atri/api')
  const versionInfo = ref<VersionInfo | null>(null)
  const updating = ref(false)
  const checkingVersion = ref(false)

  const fetchVersionInfo = async (force = false): Promise<VersionInfo> => {
    const response = await getRequest(
      `${prefix}/main/get_version_info`,
      force ? { force: true } : undefined,
    )
    const resp = response.data as { suc?: boolean; info?: string; data?: VersionInfo }
    if (!resp?.suc || !resp.data) {
      throw new Error(resp?.info || '获取更新信息失败')
    }
    versionInfo.value = resp.data
    return resp.data
  }

  /** 首次加载只展示状态，不打断用户操作。 */
  const getVersionInfo = () => {
    void fetchVersionInfo().catch((error) => {
      console.error('getVersionInfo error', error)
    })
  }

  const checkForUpdates = async () => {
    if (checkingVersion.value) return
    checkingVersion.value = true
    try {
      const info = await fetchVersionInfo(true)
      if (info.error) {
        throw new Error(info.error)
      }
      if (info.has_update) {
        message?.success({ message: `发现新版本 ${info.latest}` })
      } else {
        message?.success({ message: '当前已是最新版本' })
      }
    } catch (error) {
      console.error('checkForUpdates error', error)
      message?.error({
        message: `检查更新失败：${error instanceof Error ? error.message : error}`,
      })
    } finally {
      checkingVersion.value = false
    }
  }

  /** 发布说明是整段 markdown，页首悬浮提示只展示第一行。 */
  const firstLine = (text: string): string => {
    const lines = (text || '')
      .split('\n')
      .map((line) => line.replace(/^[#*\-\s]+/u, '').trim())
    return lines.find((line) => line.length > 0) ?? ''
  }

  const handleUpdate = async () => {
    try {
      await ElMessageBox.confirm(
        `将更新到 ${versionInfo.value?.latest}，更新完成后需要重启才会生效。`,
        '确认更新',
        { confirmButtonText: '开始更新', cancelButtonText: '再想想', type: 'warning' },
      )
    } catch (error) {
      if (error === 'cancel' || error === 'close') return
      console.error('confirmUpdate error', error)
      message?.error({ message: '无法确认更新' })
      return
    }

    updating.value = true
    try {
      const response = await postRequest(`${prefix}/configure/update`, {})
      const resp = response.data as { suc?: boolean; info?: string }
      if (!resp?.suc) {
        message?.error({ message: resp?.info || '更新失败' })
        return
      }

      message?.success({ message: resp.info || '更新完成' })
      versionInfo.value = null
    } catch (error) {
      message?.error({ message: '更新失败：' + (error instanceof Error ? error.message : error) })
      return
    } finally {
      updating.value = false
    }

    try {
      await ElMessageBox.confirm(
        'WebUI 更新已完成，是否立即重启？',
        '更新完成',
        { confirmButtonText: '立即重启', cancelButtonText: '稍后重启', type: 'warning' },
      )
    } catch (error) {
      if (error === 'cancel' || error === 'close') return
      console.error('confirmRestart error', error)
      message?.error({ message: '无法确认是否重启' })
      return
    }

    try {
      const response = await postRequest(`${prefix}/configure/restart`, {})
      const resp = response.data as { suc?: boolean; info?: string }
      if (resp?.suc) {
        message?.success({ message: resp.info || '重启命令已执行' })
      } else {
        message?.error({ message: resp?.info || '重启失败' })
      }
    } catch (error) {
      message?.error({ message: '重启失败：' + (error instanceof Error ? error.message : error) })
    }
  }

  return {
    versionInfo,
    updating,
    checkingVersion,
    getVersionInfo,
    checkForUpdates,
    firstLine,
    handleUpdate,
  }
}
