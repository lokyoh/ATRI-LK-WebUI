<template>
  <div id="app" :style="{ height: computedHeight + 'px' }">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, provide } from "vue"
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
  const savedTheme = localStorage.getItem("app-theme") || "default"
  setTheme(savedTheme)
})

onUnmounted(() => {
  window.removeEventListener("resize", handleResize)
})

watch(theme, (newTheme) => {
  document.documentElement.setAttribute("data-theme", newTheme)
})

function handleResize() {
  windowHeight.value = window.innerHeight
}

function setTheme(themeName: string) {
  if (["light", "dark", "pink", "one-dark"].includes(themeName)) {
    theme.value = themeName
    localStorage.setItem("app-theme", themeName)
    document.documentElement.setAttribute("data-theme", themeName)
  } else {
    console.warn(`Invalid theme name: ${themeName}. Defaulting to light.`)
    setTheme("light")
  }
}

provide('setAppTheme', setTheme)
</script>
