import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import statusWebSocket from "@/utils/websocket/status-websocket.ts";
// import logWebSocket from "@/utils/websocket/log-websocket.ts";
import type { BotInfo } from "@/types/bot";

// 定义类型接口
interface WsStatusObj {
  cpuList: number[];
  memoryList: number[];
  diskList: number[];
  timeList: string[];
}
export interface WsStatusData {
  cpu: number;
  memory: number;
  disk: number;
  check_time: string;
  [key: string]: number | string;
}

// 使用 Pinia 定义 store
export const useMainStore = defineStore(
  "main",
  () => {
    // state
    const botType = ref<string | null>(null);
    const botInfo = ref<BotInfo | null>(null);
    const wsStatusData = ref<unknown>(null);
    const wsStatusObj = reactive<WsStatusObj>({
      cpuList: [],
      memoryList: [],
      diskList: [],
      timeList: [],
    });

    // getters
    const getWsStatusData = () => wsStatusData.value;
    const getWsStatusObj = () => wsStatusObj;

    // mutations 转换为 actions
    function setBotType(type: string | null) {
      botType.value = type;
    }

    function setBot(info: BotInfo | null) {
      botInfo.value = info;
    }

    function setWsStatusData(data: WsStatusData) {
      // 处理时间
      const timeStr = data.check_time?.split("T")[1] || "";

      wsStatusObj.timeList.push(timeStr);
      wsStatusObj.cpuList.push(data.cpu);
      wsStatusObj.memoryList.push(data.memory);
      wsStatusObj.diskList.push(data.disk);

      // 限制列表长度为10
      if (wsStatusObj.timeList.length > 10) {
        wsStatusObj.timeList.splice(0, 1);
        wsStatusObj.cpuList.splice(0, 1);
        wsStatusObj.memoryList.splice(0, 1);
        wsStatusObj.diskList.splice(0, 1);
      }

      wsStatusData.value = data;
    }

    // WebSocket actions
    function initStatusSocket() {
      statusWebSocket.initWebSocket((event: MessageEvent) => {
        const data = JSON.parse(event.data);
        setWsStatusData(data);
      });
    }

    function closeStatusSocket() {
      statusWebSocket.close();
    }

    // function initLogSocket(callable: (data: string) => void) {
    //   logWebSocket.initWebSocket((event: MessageEvent) => {
    //     callable(event.data);
    //   });
    // }

    return {
      botType,
      botInfo,
      wsStatusData,
      wsStatusObj,
      getWsStatusData,
      getWsStatusObj,
      setBotType,
      setBot,
      setWsStatusData,
      initStatusSocket,
      closeStatusSocket,
      // initLogSocket,
    };
  },
  {
    // 持久化配置
    persist: {
      storage: localStorage,
      key: "main-store",
      pick: ["botType", "botInfo"],
    },
  },
);
