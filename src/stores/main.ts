import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import statusWebSocket from "@/utils/websocket/status-websocket.ts";
// import logWebSocket from "@/utils/websocket/log-websocket.ts";
// import chatWebSocket from "@/utils/websocket/chat-websocket.ts";

// 定义类型接口
export interface BotInfo {
  self_id: string;
  nickname: string;
  ava_url: string;
  friend_count: number;
  group_count: number;
  received_messages: number;
  connect_time: number;
  connect_date: string;
  connect_count: number;
  status: boolean;
  is_select: boolean;
  day_call: number;
  version: string;
}
interface ChatMessage {
  chatId: string | number | null;
  obj?: unknown;
  [key: string]: unknown;
}
interface ChatData {
  unreadCount: number;
  msgList: unknown[];
  time: number;
}
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
    const chatObj = ref<Record<string, ChatData>>({});
    const chatId = ref<string | null>(null);
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

    function setChatId(id: string | null) {
      chatId.value = id;
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

    function addChatMsg(data: ChatMessage) {
      const currentChatObj = { ...chatObj.value };
      const targetChatId = data.chatId;

      if (targetChatId) {
        // 初始化如果不存在
        if (!currentChatObj[targetChatId]) {
          currentChatObj[targetChatId] = {
            unreadCount: 0,
            msgList: [],
            time: 0,
          };
        }

        if (data.obj) {
          // 使用临时变量
          const chatData = currentChatObj[targetChatId];
          if (chatData) {
            chatData.msgList.push(data.obj);
            chatData.time = Date.now();

            if (targetChatId !== chatId.value) {
              chatData.unreadCount += 1;
            }

            if (chatData.msgList.length > 50) {
              chatData.msgList.splice(0, 1);
            }
          }
        }
      }

      chatObj.value = currentChatObj;
    }

    function readChat(targetChatId: string) {
      const currentChatObj = { ...chatObj.value };
      if (currentChatObj[targetChatId]) {
        currentChatObj[targetChatId].unreadCount = 0;
        chatObj.value = currentChatObj;
      }
    }

    function clearChat(targetChatId?: string) {
      const currentChatObj = { ...chatObj.value };

      if (targetChatId) {
        currentChatObj[targetChatId] = {
          unreadCount: 0,
          msgList: [],
          time: 0,
        };
      } else {
        // 清空所有聊天
        chatObj.value = {};
        return;
      }

      chatObj.value = currentChatObj;
    }

    // WebSocket actions
    function initStatusSocket() {
      statusWebSocket.initWebSocket((event: MessageEvent) => {
        const data = JSON.parse(event.data);
        setWsStatusData(data);
      });
    }

    // function initLogSocket(callable: (data: string) => void) {
    //   logWebSocket.initWebSocket((event: MessageEvent) => {
    //     callable(event.data);
    //   });
    // }

    // function initChatSocket() {
    //   chatWebSocket.initWebSocket();
    // }

    return {
      botType,
      botInfo,
      chatObj,
      chatId,
      wsStatusData,
      wsStatusObj,
      getWsStatusData,
      getWsStatusObj,
      setBotType,
      setBot,
      setChatId,
      setWsStatusData,
      addChatMsg,
      readChat,
      clearChat,
      initStatusSocket,
      // initLogSocket,
      // initChatSocket,
    };
  },
  {
    // 持久化配置
    persist: {
      storage: localStorage,
      key: "main-store",
      pick: ["botType", "botInfo", "chatObj", "chatId"],
    },
  },
);
