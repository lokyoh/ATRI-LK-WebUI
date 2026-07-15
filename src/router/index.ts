import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useRouteStore } from "@/stores/route";
import LoginPage from "@/views/LoginPage.vue";
import MyApi from "@/views/MyApi.vue";
import HomePage from "@/views/HomePage.vue";
import DashBoardPage from "@/views/dashboard/DashBoardPage.vue";
import AboutPage from "@/views/about/AboutPage.vue";
import MainCommandPage from "@/views/command/MainCommandPage.vue";
import PluginManagePage from "@/views/plugin/PluginManagePage.vue";
import StoreManagePage from "@/views/store/StoreManagePage.vue";
import AgentPage from "@/views/agent/AgentPage.vue";
// 定义路由类型
const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Login",
    component: LoginPage,
    meta: { requiresAuth: false },
  },
  {
    path: "/myapi",
    name: "MyApi",
    component: MyApi,
    meta: { requiresAuth: false },
  },
  {
    path: "/home",
    name: "Home",
    component: HomePage,
    redirect: "/dashboard",
    meta: { requiresAuth: true },
    children: [
      {
        path: "/dashboard",
        name: "仪表盘",
        component: DashBoardPage,
        meta: { requiresAuth: true, title: "仪表盘" },
      },
      {
        path: "/command",
        name: "BOT控制台",
        component: MainCommandPage,
        meta: { requiresAuth: true, title: "BOT控制台" },
      },
      {
        path: "/plugin",
        name: "插件列表",
        component: PluginManagePage,
        meta: { requiresAuth: true, title: "插件列表" },
      },
      {
        path: "/store",
        name: "插件商店",
        component: StoreManagePage,
        meta: { requiresAuth: true, title: "插件商店" },
      },
      {
        path: "/about",
        name: "关于我们",
        component: AboutPage,
        meta: { requiresAuth: true, title: "关于我们" },
      },
      {
        path: "/agent",
        name: "AI模型设置",
        component: AgentPage,
        meta: { requiresAuth: true, title: "AI模型设置" },
      },
    ],
  },
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 模式
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, left: 0 }; // Vue 3 使用 top/left 替代 x/y
    }
  },
});

// 路由守卫
router.beforeEach((to, from) => {
  const isAuthenticated = window.sessionStorage.getItem("isAuthenticated");
  const routerStore = useRouteStore();
  routerStore.setFromRoute(from);
  // 检查路由是否需要认证
  if (to.meta.requiresAuth && !isAuthenticated) {
    return "/"; // 重定向到登录页面
  } else {
    return true;
  }
});

// 添加路由加载后的标题设置（可选）
router.afterEach((to) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }
});

export default router;
