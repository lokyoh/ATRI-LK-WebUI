import { getBaseUrl } from "@/utils/api";
import { message } from "../message";

/**
 * 系统状态 WebSocket。
 *
 * 生命周期由 `stores/main.ts` 统一管理：仪表盘挂载时 start，卸载时 stop，
 * 不再用「断了就无条件重连」的写法 —— 页面已经离开时重连只会留下裸连接。
 */
class StatusWebSocket {
  private ws: WebSocket | null = null;
  private url: string = "";
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private callback: ((event: MessageEvent) => void) | null = null;
  private manualClose = false;

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send("ping"); // 发送心跳消息
      }
    }, 5000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval); // 停止心跳检测定时器
      this.heartbeatInterval = null;
    }
  }

  private buildUrl() {
    const baseUrl = new URL(getBaseUrl());
    return `${baseUrl.protocol === "https:" ? "wss:" : "ws:"}//${baseUrl.host}/atri/socket/system_status`;
  }

  initWebSocket(callback: (event: MessageEvent) => void) {
    // 重复 init 会留下多个连接与心跳，这里先收掉旧的
    this.close();
    this.manualClose = false;
    this.callback = callback;
    this.url = this.buildUrl();
    this.ws = new WebSocket(this.url);
    this.startHeartbeat();

    this.ws.onopen = () => {
      console.log("StatusWebSocket connected");
    };

    this.ws.onmessage = callback;

    this.ws.onclose = () => {
      this.stopHeartbeat();
      if (this.manualClose) return;
      // 只在仍处于「活跃」状态时重连，避免离页后无限重试
      message.warning("StatusWebSocket disconnected, reconnecting...");
      this.reconnectTimer = setTimeout(() => {
        if (this.callback) this.initWebSocket(this.callback);
      }, 5000);
    };

    this.ws.onerror = (error) => {
      console.error("StatusWebSocket error:", error);
    };
  }

  close() {
    this.manualClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.callback = null;
  }
}

const statusWebSocket = new StatusWebSocket();
export default statusWebSocket;
