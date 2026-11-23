import { getBaseUrl } from "@/utils/api";

/**
 * 日志 WebSocket。
 *
 * 与 StatusWebSocket 同一套生命周期约定：页面挂载时 connect，卸载时 close，
 * close 之后绝不重连，避免离页后在后台无限重试留下裸连接。
 * 重连采用指数退避（1s 起，封顶 15s），连接成功后重置退避计数。
 */
type LogWsState = "connected" | "reconnecting";

class LogWebSocket {
  private ws: WebSocket | null = null;
  private url: string = "";
  private callback: ((message: string) => void) | null = null;
  private onState: ((state: LogWsState) => void) | null = null;
  /** 每次连接（含重连）成功后发送的握手鉴权报文生成器（token + 可选续传参数） */
  private getInitialPayload: (() => string | undefined) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manualClose = false;
  private retry = 0;

  private static readonly MAX_RETRY_DELAY = 15000;

  private buildUrl() {
    const baseUrl = new URL(getBaseUrl());
    return `${baseUrl.protocol === "https:" ? "wss:" : "ws:"}//${baseUrl.host}/atri/socket/logs`;
  }

  connect(
    callback: (message: string) => void,
    onState?: (state: LogWsState) => void,
    getInitialPayload?: () => string | undefined,
  ) {
    // 重复 connect 先收掉旧连接，防止泄漏多个 socket
    this.close();
    this.manualClose = false;
    this.retry = 0;
    this.callback = callback;
    this.onState = onState ?? null;
    this.getInitialPayload = getInitialPayload ?? null;
    this.url = this.buildUrl();
    this.open();
  }

  private open() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      // 连接成功后重置退避，恢复「断了立刻重连」的能力
      this.retry = 0;
      const initialPayload = this.getInitialPayload?.();
      if (initialPayload && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(initialPayload);
      }
      this.onState?.("connected");
      console.log("LogWebSocket connected");
    };

    this.ws.onmessage = (event) => {
      this.callback?.(typeof event.data === "string" ? event.data : String(event.data));
    };

    this.ws.onerror = () => {
      // onclose 一定会跟着触发，重连逻辑统一收口在 onclose
    };

    this.ws.onclose = () => {
      if (this.manualClose) return;
      const delay = Math.min(1000 * 2 ** this.retry, LogWebSocket.MAX_RETRY_DELAY);
      this.retry += 1;
      console.warn(`LogWebSocket disconnected, retry in ${delay}ms`);
      this.onState?.("reconnecting");
      this.reconnectTimer = setTimeout(() => {
        if (!this.manualClose) this.open();
      }, delay);
    };
  }

  close() {
    this.manualClose = true;
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
    this.onState = null;
    this.getInitialPayload = null;
  }
}

const logWebSocket = new LogWebSocket();
export default logWebSocket;
