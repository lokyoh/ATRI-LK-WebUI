<template>
  <div class="lkbot-user-page flex flex-col">
    <div class="page-heading shrink-0">
      <div>
        <h1>用户信息</h1>
        <p>管理账号资料、绑定关系与个人数据</p>
      </div>
      <div class="heading-total">
        <span class="heading-total__value">{{ users.length }}</span>
        <span class="heading-total__label">个账号</span>
      </div>
    </div>

    <!-- 工具栏 -->
    <div
      class="toolbar flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-3 shrink-0"
    >
      <el-input v-model="keyword" placeholder="搜索昵称或账号 ID" clearable class="search-input">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-button type="primary" :loading="loading" @click="loadUsers">
        <el-icon class="refresh-icon"><Refresh /></el-icon>
        刷新列表
      </el-button>
    </div>

    <!-- 提示 -->
    <el-alert
      class="account-note shrink-0"
      type="info"
      :closable="false"
      show-icon
      title="绑定账号会解析到主账号；数据、记忆与主人权限均以主账号为准。"
    />

    <!-- 主内容 -->
    <section class="table-panel flex-1 min-h-0">
      <div class="main-content">
        <el-config-provider :locale="zhCn">
          <el-table
            v-loading="loading"
            :data="filteredUsers"
            :row-class-name="rowClassName"
            empty-text="还没有 lkbot 用户"
            class="user-table"
            height="100%"
            :default-sort="{ prop: 'exp', order: 'descending' }"
          >
            <el-table-column
              prop="id"
              label="用户"
              min-width="220"
              :sort-method="sortById"
              sortable
            >
              <template #default="{ row }">
                <div class="user-identity">
                  <span class="user-identity__text">
                    <span class="user-identity__name">
                      {{ row.name || '未命名用户' }}
                      <el-tag v-if="row.is_master" type="danger" size="small" effect="light">
                        主人
                      </el-tag>
                    </span>
                    <span class="user-identity__id mono">{{ row.id }}</span>
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="绑定关系" min-width="170">
              <template #default="{ row }">
                <el-tag v-if="row.bound_to" type="warning" effect="light" size="small">
                  小号 · 主账号 {{ row.bound_to }}
                </el-tag>
                <span v-else class="sub-hint">独立账号</span>
              </template>
            </el-table-column>
            <el-table-column prop="level" label="等级" width="130" sortable>
              <template #default="{ row }">
                <div class="level-cell">
                  <span class="level-badge">Lv.{{ row.level }}</span>
                  <span class="metric-note">还需 {{ row.left_exp }} EXP</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="exp" label="经验值" width="110" align="right" sortable>
              <template #default="{ row }">
                <span class="metric-value">{{ row.exp.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="money" label="ATRI 币" width="115" align="right" sortable>
              <template #default="{ row }">
                <span class="metric-value metric-value--coin">{{
                  row.money.toLocaleString()
                }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="love" label="好感度" width="105" align="right" sortable>
              <template #default="{ row }">
                <span class="metric-value metric-value--love">{{ row.love.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="signdays" label="签到" min-width="130" sortable>
              <template #default="{ row }">
                <div class="sign-cell">
                  <span class="metric-value">{{ row.signdays }} 天</span>
                  <span class="metric-note">最近 {{ row.lastsign || '—' }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right" align="center">
              <template #default="{ row }">
                <div class="table-actions">
                  <el-button class="detail-button" size="small" @click="openDetail(row.id)">
                    查看档案
                  </el-button>
                  <el-button
                    v-if="row.bound_to"
                    size="small"
                    link
                    type="danger"
                    :loading="pending.has(row.id)"
                    @click="handleUnbind(row.id)"
                  >
                    解绑
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-config-provider>
      </div>
    </section>

    <!-- 详情 / 编辑 -->
    <NeonDialog
      :visible="detailVisible"
      title="用户详情"
      icon-class="fas fa-user"
      confirm-text="保存修改"
      cancel-text="关闭"
      width="xl"
      @update:visible="detailVisible = $event"
      @confirm="handleSave"
      @cancel="detailVisible = false"
    >
      <div v-if="detail" class="detail-body">
        <div class="id-line">
          <span class="sub-hint">账号 ID</span>
          <span class="mono">{{ detail.id }}</span>
          <el-tag v-if="detail.is_master" type="danger" size="small">主人</el-tag>
        </div>

        <div class="form-grid">
          <label>名称</label>
          <el-input v-model="editForm.name" maxlength="20" show-word-limit size="small" />

          <label>等级</label>
          <div class="lvl-text">
            Lv.{{ detail.level }}
            <span class="sub-hint">（差 {{ detail.left_exp }} 经验升级，改经验后自动重算）</span>
          </div>

          <label>经验</label>
          <el-input-number
            v-model="editForm.exp"
            :min="0"
            :step="10"
            controls-position="right"
            size="small"
          />

          <label>ATRI 币</label>
          <el-input-number
            v-model="editForm.money"
            :min="0"
            :step="10"
            controls-position="right"
            size="small"
          />

          <label>好感度</label>
          <el-input-number
            v-model="editForm.love"
            :step="1"
            controls-position="right"
            size="small"
          />

          <label>签到天数</label>
          <div class="inline-row">
            <span class="readonly-value">{{ detail.signdays }} 天</span>
            <span class="sub-hint">上次 {{ detail.lastsign }}</span>
          </div>
        </div>

        <div
          v-if="detail.bound_to"
          class="hint-bar px-3 py-2 rounded-lg text-xs"
          :style="{
            backgroundColor: 'var(--warning-color-light)',
            color: 'var(--warning-color)',
            border: '1px dashed var(--warning-color)',
          }"
        >
          这个账号是小号，解析到主账号 {{ detail.bound_to }}
        </div>

        <div class="inventory-heading">
          <div>
            <div class="section-title">背包物品</div>
            <div class="sub-hint">调整持有数量，数量设为 0 即可移除</div>
          </div>
          <el-tag type="warning" effect="light" round> {{ detail.backpack.length }} 种物品 </el-tag>
        </div>
        <div v-if="detail.backpack.length" class="backpack-table">
          <el-table :data="detail.backpack" size="small" class="inventory-table">
            <el-table-column prop="name" label="物品名称" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="item-name">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="分类" width="120">
              <template #default="{ row }">
                <el-tag size="small" effect="plain" round>{{ row.type || '未分类' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="持有数量" width="160" align="center">
              <template #default="{ row }">
                <el-input-number
                  :model-value="row.num"
                  :min="0"
                  :step="1"
                  size="small"
                  controls-position="right"
                  class="item-quantity"
                  :disabled="backpackPending.has(row.name)"
                  @update:model-value="(v: number | undefined) => handleSetItem(row.name, v ?? 0)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" align="center">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="danger"
                  plain
                  :loading="backpackPending.has(row.name)"
                  @click="handleSetItem(row.name, 0)"
                >
                  移除物品
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else class="sub-hint">背包是空的</div>

        <div class="bind-row item-add-row">
          <CuteButton
            type="primary"
            size="sm"
            rounded
            class="px-3 py-1 text-xs"
            @click="openItemPicker"
          >
            添加物品
          </CuteButton>
          <span class="sub-hint">可从物品目录中选择并放入背包</span>
        </div>

        <div class="section-title">已绑定的小号（{{ detail.bindings.length }}）</div>
        <el-table v-if="detail.bindings.length" :data="detail.bindings" size="small" border>
          <el-table-column label="小号 ID" min-width="170">
            <template #default="{ row }">
              <span class="mono">{{ row.account_id }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button
                size="small"
                link
                type="danger"
                :loading="pending.has(row.account_id)"
                @click="handleUnbind(row.account_id)"
              >
                解绑
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-else class="sub-hint">还没有绑定任何小号</div>

        <div class="section-title">绑定一个新账号</div>
        <div class="bind-row">
          <el-input
            v-model="bindAccountId"
            size="small"
            placeholder="要绑定的账号 ID（小号）"
            class="bind-input"
          />
          <CuteButton
            type="primary"
            size="sm"
            rounded
            class="px-3 py-1 text-xs"
            :loading="binding"
            @click="handleBind"
          >
            绑定
          </CuteButton>
        </div>
      </div>
    </NeonDialog>

    <!-- 选物品：分类 + 筛选 + 数量 -->
    <NeonDialog
      :visible="pickerVisible"
      title="添加物品"
      icon-class="fas fa-box-open"
      confirm-text="放入背包"
      cancel-text="取消"
      width="lg"
      @update:visible="pickerVisible = $event"
      @confirm="handlePickItem"
      @cancel="pickerVisible = false"
    >
      <div class="picker-body">
        <div class="picker-filters">
          <el-input
            v-model="pickerKeyword"
            size="small"
            placeholder="搜索物品名"
            clearable
            class="picker-search"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select
            v-model="pickerType"
            size="small"
            placeholder="全部分类"
            clearable
            class="picker-type"
          >
            <el-option v-for="t in catalog.types" :key="t" :label="t" :value="t" />
          </el-select>
          <el-input-number
            v-model="pickerNum"
            :min="1"
            :step="1"
            size="small"
            controls-position="right"
          />
        </div>

        <div class="picker-count sub-hint">
          共 {{ filteredCatalog.length }} 种<template
            v-if="catalog.items.length !== filteredCatalog.length"
          >
            ，全部 {{ catalog.items.length }} 种</template
          >
        </div>

        <div v-loading="catalogLoading" class="picker-grid">
          <button
            v-for="entry in filteredCatalog"
            :key="entry.name"
            type="button"
            class="picker-item"
            :class="{ 'is-selected': pickerItem === entry.name }"
            @click="pickerItem = entry.name"
          >
            <span class="picker-item__name">{{ entry.name }}</span>
            <span class="picker-item__type">{{ entry.type }}</span>
          </button>
          <div v-if="!catalogLoading && !filteredCatalog.length" class="sub-hint picker-empty">
            没有匹配的物品
          </div>
        </div>
      </div>
    </NeonDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { Refresh, Search } from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { ElMessageBox } from 'element-plus'
import type { LkItemCatalog, LkUserDetail, LkUserInfo } from '@/types/lkbot-user'
import { getRequest, postRequest } from '@/utils/api'
import { message } from '@/utils/message'
import CuteButton from '@/components/ui/CuteButton.vue'
import NeonDialog from '@/components/ui/NeonDialog.vue'

interface ResultResponse<T> {
  suc: boolean
  code: number
  info: string
  data?: T
}

const prefix = inject<string>('prefix', '/atri/api')
const loading = ref(false)
const users = ref<LkUserInfo[]>([])
const keyword = ref('')

const detailVisible = ref(false)
const detail = ref<LkUserDetail | null>(null)
const bindAccountId = ref('')
const binding = ref(false)
const pending = ref<Set<string>>(new Set())

const saving = ref(false)
const backpackPending = ref<Set<string>>(new Set())

const pickerVisible = ref(false)
const catalogLoading = ref(false)
const catalog = ref<LkItemCatalog>({ items: [], types: [] })
const pickerKeyword = ref('')
const pickerType = ref('')
const pickerNum = ref(1)
const pickerItem = ref('')
const editForm = ref({ name: '', exp: 0, money: 0, love: 0, signdays: 0 })

const filteredUsers = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return users.value
  return users.value.filter((u) =>
    [u.name, u.id].some((field) => String(field).toLowerCase().includes(key)),
  )
})

const rowClassName = ({ row }: { row: LkUserInfo }) => (row.is_master ? 'row-master' : '')

/**
 * 账号 ID 排序。
 *
 * ID 是字符串，直接比大小是按字典序：`100 < 99`，看起来像乱序。
 * 纯数字的先按数值排（QQ 号就属于这种）；QQ 官方 openid 不是数字，
 * 数值排不了，退回字典序——总比报错强。
 */
const sortById = (a: LkUserInfo, b: LkUserInfo) => {
  const left = Number(a.id)
  const right = Number(b.id)
  if (Number.isFinite(left) && Number.isFinite(right)) return left - right
  return a.id.localeCompare(b.id)
}

const loadCatalog = async () => {
  if (catalog.value.items.length) return
  catalogLoading.value = true
  try {
    const response = await getRequest(`${prefix}/lkbot/get_item_catalog`)
    const payload = response.data as ResultResponse<LkItemCatalog>
    if (payload.suc && payload.data) catalog.value = payload.data
    else message.error(payload.info || '获取物品目录失败')
  } catch (error) {
    console.error('loadCatalog error', error)
    message.error('获取物品目录失败，请检查接口状态')
  } finally {
    catalogLoading.value = false
  }
}

/** 关键词 + 分类双重筛选 */
const filteredCatalog = computed(() => {
  const key = pickerKeyword.value.trim().toLowerCase()
  return catalog.value.items.filter((entry) => {
    if (pickerType.value && entry.type !== pickerType.value) return false
    if (key && !entry.name.toLowerCase().includes(key)) return false
    return true
  })
})

const openItemPicker = () => {
  pickerKeyword.value = ''
  pickerType.value = ''
  pickerNum.value = 1
  pickerItem.value = ''
  pickerVisible.value = true
  void loadCatalog()
}

const markBackpack = (name: string, on: boolean) => {
  if (on) backpackPending.value.add(name)
  else backpackPending.value.delete(name)
  backpackPending.value = new Set(backpackPending.value)
}

const setBackpackItem = async (name: string, num: number) => {
  if (!detail.value || !name) return
  markBackpack(name, true)
  try {
    const response = await postRequest(`${prefix}/lkbot/set_backpack_item`, {
      user_id: detail.value.id,
      name,
      num,
    })
    const payload = response.data as ResultResponse<LkUserDetail>
    if (payload.suc && payload.data) {
      message.success('背包已更新')
      detail.value = payload.data
    } else {
      message.error(payload.info || '修改背包失败')
    }
  } catch (error) {
    console.error('setBackpackItem error', error)
    message.error('修改背包失败，请检查接口状态')
  } finally {
    markBackpack(name, false)
  }
}

const handleSetItem = (name: string, num: number) => {
  if (num < 0) return
  void setBackpackItem(name, num)
}

const handlePickItem = async () => {
  if (!pickerItem.value) {
    message.error('请先选中一个物品')
    return
  }
  await setBackpackItem(pickerItem.value, pickerNum.value)
  pickerVisible.value = false
}

const resetForm = () => {
  if (!detail.value) return
  editForm.value = {
    name: detail.value.name,
    exp: detail.value.exp,
    money: detail.value.money,
    love: detail.value.love,
    signdays: detail.value.signdays,
  }
}

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await getRequest(`${prefix}/lkbot/get_users`)
    const payload = response.data as ResultResponse<LkUserInfo[]>
    if (payload.suc) {
      users.value = payload.data || []
    } else {
      message.error(payload.info || '获取用户列表失败')
    }
  } catch (error) {
    console.error('loadUsers error', error)
    message.error('获取用户列表失败，请检查接口状态')
  } finally {
    loading.value = false
  }
}

const openDetail = async (userId: string) => {
  try {
    const response = await getRequest(`${prefix}/lkbot/get_user`, { user_id: userId })
    const payload = response.data as ResultResponse<LkUserDetail>
    if (!payload.suc || !payload.data) {
      message.error(payload.info || '获取用户详情失败')
      return
    }
    detail.value = payload.data
    bindAccountId.value = ''
    resetForm()
    detailVisible.value = true
  } catch (error) {
    console.error('openDetail error', error)
    message.error('获取用户详情失败，请检查接口状态')
  }
}

const handleSave = async () => {
  if (!detail.value) return
  saving.value = true
  try {
    const response = await postRequest(`${prefix}/lkbot/update_user`, {
      user_id: detail.value.id,
      name: editForm.value.name,
      exp: editForm.value.exp,
      money: editForm.value.money,
      love: editForm.value.love,
      signdays: editForm.value.signdays,
    })
    const payload = response.data as ResultResponse<LkUserDetail>
    if (payload.suc && payload.data) {
      message.success(payload.info || '已保存')
      detail.value = payload.data
      resetForm()
      await loadUsers()
    } else {
      message.error(payload.info || '保存失败')
    }
  } catch (error) {
    console.error('saveUser error', error)
    message.error('保存失败，请检查接口状态')
  } finally {
    saving.value = false
  }
}

const handleBind = async () => {
  const accountId = bindAccountId.value.trim()
  if (!accountId || !detail.value) {
    message.error('请填写要绑定的账号 ID')
    return
  }
  binding.value = true
  try {
    const response = await postRequest(`${prefix}/lkbot/bind_account`, {
      account_id: accountId,
      master_id: detail.value.id,
    })
    const payload = response.data as ResultResponse<null>
    if (payload.suc) {
      message.success(payload.info || '绑定成功')
      bindAccountId.value = ''
      await openDetail(detail.value.id)
      await loadUsers()
    } else {
      message.error(payload.info || '绑定失败')
    }
  } catch (error) {
    console.error('bindAccount error', error)
    message.error('绑定失败，请检查接口状态')
  } finally {
    binding.value = false
  }
}

const handleUnbind = async (accountId: string) => {
  try {
    await ElMessageBox.confirm(
      `确定解除 ${accountId} 的绑定吗？它的数据会与主账号分开。`,
      '解除绑定',
      { confirmButtonText: '解绑', cancelButtonText: '再想想', type: 'warning' },
    )
  } catch (error) {
    if (error !== 'cancel') console.error('unbind confirm error', error)
    return
  }
  pending.value.add(accountId)
  pending.value = new Set(pending.value)
  try {
    const response = await postRequest(`${prefix}/lkbot/unbind_account`, {
      account_id: accountId,
    })
    const payload = response.data as ResultResponse<null>
    if (payload.suc) {
      message.success(payload.info || '已解绑')
      if (detail.value) await openDetail(detail.value.id)
      await loadUsers()
    } else {
      message.error(payload.info || '解绑失败')
    }
  } catch (error) {
    console.error('unbindAccount error', error)
    message.error('解绑失败，请检查接口状态')
  } finally {
    pending.value.delete(accountId)
    pending.value = new Set(pending.value)
  }
}

onMounted(loadUsers)
</script>

<style lang="scss" scoped>
.lkbot-user-page {
  position: relative;
  width: 100%;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  gap: 8px;
  padding: 12px 16px 14px;
  background: linear-gradient(125deg, var(--el-bg-color-page) 0%, var(--el-fill-color-light) 100%);
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.page-heading h1 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  line-height: 1.25;
}

.page-heading p,
.table-panel__heading p {
  margin: 2px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.heading-total {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.heading-total__value {
  color: var(--el-color-primary);
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.heading-total__label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.toolbar {
  position: relative;
  gap: 8px;
  margin-bottom: 0;
}

.refresh-icon {
  margin-right: 4px;
}

.account-note {
  border-radius: 10px;
  padding: 7px 12px;
}

.table-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color);
  box-shadow: 0 8px 24px rgb(15 23 42 / 4%);
}

.table-panel__heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 11px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.table-panel__heading h2 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 650;
}

.table-panel__heading p {
  font-size: 12px;
}

.main-content {
  flex: 1;
  min-height: 0;
  padding: 0 14px 14px;
}

.search-input {
  width: 100%;
  max-width: 420px;
}

.user-table {
  height: 100%;
  background: transparent;

  :deep(.el-table__inner-wrapper) {
    background: transparent;
  }

  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }

  :deep(.el-table__header th.el-table__cell) {
    height: 44px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 600;
    background: var(--el-fill-color-light);
  }

  :deep(.el-table__body td.el-table__cell) {
    padding: 12px 0;
  }

  :deep(.el-table th.el-table__cell),
  :deep(.el-table td.el-table__cell) {
    border-right: 0;
  }

  :deep(.el-table__row td.el-table__cell) {
    transition: background-color 0.18s ease;
  }

  :deep(.row-master td:first-child .cell) {
    color: var(--el-text-color-primary);
  }

  :deep(.el-table__empty-block) {
    min-height: 180px;
  }
}

.user-identity {
  display: flex;
  align-items: center;
  min-width: 0;
}

.user-identity__text,
.user-identity__name,
.level-cell,
.sign-cell {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-identity__name {
  flex-direction: row;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-identity__id {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
}

.level-cell,
.sign-cell {
  gap: 4px;
}

.level-badge {
  width: fit-content;
  padding: 2px 8px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 6px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-size: 12px;
  font-weight: 650;
}

.metric-value {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.metric-value--coin {
  color: var(--el-color-warning-dark-2);
}

.metric-value--love {
  color: var(--el-color-danger);
}

.metric-note {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.detail-button {
  border-radius: 8px;
}

.table-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.sub-hint {
  color: var(--text-color-secondary);
  font-size: 12px;
}

.lvl-text {
  color: var(--primary-color);
  font-weight: 600;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 60vh;
  overflow-y: auto;
}

.id-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: 76px 1fr;
  align-items: center;
  gap: 10px 12px;

  label {
    font-size: 13px;
    color: var(--text-color-secondary);
  }
}

.inline-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  margin-top: 6px;
  font-weight: 600;
  font-size: 14px;
  color: var(--primary-color);
}

.inventory-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.inventory-heading .section-title {
  margin: 0 0 3px;
  color: var(--el-text-color-primary);
}

.bind-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.bind-input {
  max-width: 260px;
}

.item-add-row {
  margin-top: -2px;
}

.readonly-value {
  font-weight: 600;
  color: var(--primary-color);
}

.picker-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.picker-filters {
  display: flex;
  gap: 8px;
  align-items: center;
}

.picker-search {
  flex: 1;
}

.picker-type {
  width: 130px;
}

.picker-count {
  text-align: right;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
  padding: 2px;
}

.picker-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  background: var(--bg-color-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.picker-item:hover {
  border-color: var(--primary-color-light);
}

.picker-item.is-selected {
  border-color: var(--primary-color);
  background: var(--primary-color-light-9);
}

.picker-item__name {
  font-size: 13px;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.picker-item__type {
  font-size: 11px;
  color: var(--text-color-secondary);
}

.picker-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 20px 0;
}

.backpack-table {
  flex: 0 0 auto;
  width: 100%;
  max-height: 220px;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
}

.inventory-table {
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-header-bg-color: var(--el-fill-color-light);
  --el-table-row-hover-bg-color: var(--el-fill-color-light);

  :deep(.el-table__inner-wrapper::before) {
    display: none;
  }

  :deep(.el-table th.el-table__cell) {
    height: 38px;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    font-weight: 600;
  }

  :deep(.el-table td.el-table__cell) {
    padding: 8px 0;
  }

  :deep(.el-table th.el-table__cell),
  :deep(.el-table td.el-table__cell) {
    border-right: 0;
  }

  :deep(.el-table .cell) {
    line-height: 1.4;
  }
}

.item-name {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-quantity {
  width: 118px;
}

@media (max-width: 560px) {
  .inventory-heading {
    align-items: flex-start;
  }

  .item-quantity {
    width: 105px;
  }
}

@media (max-width: 768px) {
  .lkbot-user-page {
    gap: 8px;
    padding: 10px 12px 12px;
  }

  .page-heading h1 {
    font-size: 19px;
  }

  .table-panel__heading {
    padding: 10px 12px;
  }

  .main-content {
    padding: 0 8px 8px;
  }
}
</style>
