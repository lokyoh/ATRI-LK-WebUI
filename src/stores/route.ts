import { defineStore } from "pinia";
import { ref } from "vue";
import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";

export const useRouteStore = defineStore("router", () => {
  const fromPath = ref<string>("");
  const fromName = ref<string>("");

  const setFromRoute = (from: RouteLocationNormalizedLoadedGeneric) => {
    fromPath.value = from.path;
    fromName.value = (from.name as string) || "";
  };

  return {
    fromPath,
    fromName,
    setFromRoute,
  };
});
