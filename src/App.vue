<template>
  <div id="app" :style="{ height: computedHeight + 'px' }">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, provide } from "vue"
import { getBaseUrlLocalStorage, setBaseApiUrl } from "@/utils/api"

const windowHeight = ref(window.innerHeight)
const theme = ref("light")
const computedHeight = computed(() => {
  return windowHeight.value - 1
})

if (getBaseUrlLocalStorage()) {
  setBaseApiUrl(getBaseUrlLocalStorage()!)
}

onMounted(() => {
  window.addEventListener("resize", handleResize)
  // 默认与 theme.scss 的 [data-theme='light'] 块对齐；没有存过主题就直接用 light，
  // 不再先传一个无效的 "default" 再递归回退。
  const savedTheme = localStorage.getItem("app-theme") || "light"
  setTheme(savedTheme)
})

onUnmounted(() => {
  window.removeEventListener("resize", handleResize)
})

function handleResize() {
  windowHeight.value = window.innerHeight
}

/**
 * 主题只在这里落地：设置 data-theme 让 theme.scss 的变量块生效。
 * 不再额外挂 watch 再 setAttribute —— 那会让每次切换都写两遍 DOM。
 */
function setTheme(themeName: string) {
  if (["light", "dark", "pink", "one-dark"].includes(themeName)) {
    theme.value = themeName
    localStorage.setItem("app-theme", themeName)
    document.documentElement.setAttribute("data-theme", themeName)
    return
  }
  console.warn(`Invalid theme name: ${themeName}. Defaulting to light.`)
  setTheme("light")
}

provide('setAppTheme', setTheme)
</script>
