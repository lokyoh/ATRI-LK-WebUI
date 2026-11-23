/** 后端 /menu/get_menus 返回的单个菜单项 */
export interface MenuItem {
  module: string
  name: string
  router: string
  icon: string
  default: boolean
}
