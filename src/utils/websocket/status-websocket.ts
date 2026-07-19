import { getBaseUrl } from "@/utils/api";
import { message } from "../message";

class StatusWebSocket {
  private ws: WebSocket | null = null;
  private url: string = "";
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send("ping"); // 发送心跳消息
      }
    }, 5000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval); // 停止心跳检测定时器
    }
  }

  initWebSocket(callback: (event: MessageEvent) => void) {
    const baseUrl = new URL(getBaseUrl());
    this.url = `${baseUrl.protocol === "https:" ? "wss:" : "ws:"}//${baseUrl.host}/atri/socket/system_status`;
    this.ws = new WebSocket(this.url);
    this.startHeartbeat();

    this.ws.onopen = () => {
      console.log("StatusWebSocket connected");
    };

    this.ws.onmessage = callback;

    this.ws.onclose = () => {
      message.warning("StatusWebSocket disconnected, reconnecting...");
      this.stopHeartbeat();
      setTimeout(() => this.initWebSocket(callback), 5000);
    };

    this.ws.onerror = (error) => {
      console.error("StatusWebSocket error:", error);
    };
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

const statusWebSocket = new StatusWebSocket();
export default statusWebSocket;
