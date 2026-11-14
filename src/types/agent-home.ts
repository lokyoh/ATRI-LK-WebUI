export interface HomeRoom {
  name: string
  body: string
}

export interface HomeContainer {
  name: string
  items: string[]
}

/** /agent/get_life 与 /agent/set_home 返回的家 */
export interface HomeInfo {
  summary: string
  content: string
  sections: Record<string, string>
  rooms: HomeRoom[]
  containers: HomeContainer[]
  wardrobe: string
}

/** 与后端 home.py 的 FIXED_SECTIONS 一致；房间与容器在页面里单独渲染 */
export const HOME_TEXT_SECTIONS = [
  { key: '位置', hint: '地址与外观，会进提示词' },
  { key: '周边', hint: '每行「- 地点：距离」，前三条进提示词' },
  { key: '习惯', hint: '居家小规矩，全部进提示词' },
]
