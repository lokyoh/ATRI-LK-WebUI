import { ref } from "vue";
import { defineStore } from "pinia";
import { AnsiUp } from "ansi_up";
import { buildWsHandshake } from "@/utils/api";
import logWebSocket from "@/utils/websocket/log-websocket.ts";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  id: number;
  time: string;
  level: LogLevel;
  /** 去除 ANSI 后的纯文本，检索用 */
  text: string;
  /** ansi_up 渲染出的 HTML（自带 HTML 转义），彩色控制台用 */
  html: string;
}

export type ConnectionState = "connected" | "reconnecting" | "offline";

const MAX_LOG_ENTRIES = 1000;
/** 批量冲刷间隔：日志洪峰时把 N 条合并成一次响应式更新，避免逐条触发重渲染 */
const FLUSH_INTERVAL = 150;

const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

let seq = 0;
/** 当前推送流的后端启动标识 + 已收到的最大 seq（重连握手续传用） */
let lastBoot = "";
let lastSeq = 0;

// 单实例维护跨行的 ANSI 颜色状态（与流式日志的推送顺序一致）
const ansiUp = new AnsiUp();

// loguru 级别名 → 前端四级
const BACKEND_LEVEL_MAP: Record<string, LogLevel> = {
  TRACE: "debug",
  DEBUG: "debug",
  INFO: "info",
  SUCCESS: "info",
  WARNING: "warn",
  ERROR: "error",
  CRITICAL: "error",
};

// 级别名归一化：已知 loguru 级别直接映射，未知级别从文本里猜
export function normalizeLevel(level: string, text: string): LogLevel {
  return BACKEND_LEVEL_MAP[level.toUpperCase()] || detectLevel(text);
}

// 纯文本回退时，级别只能从文本里猜
function detectLevel(text: string): LogLevel {
  if (/\bERROR\b/i.test(text)) return "error";
  if (/\b(WARN|WARNING)\b/i.test(text)) return "warn";
  if (/\bDEBUG\b/i.test(text)) return "debug";
  return "info";
}

function cleanText(raw: string): string {
  return raw.replace(ANSI_PATTERN, "").replace(/\r/g, "").trim();
}

function fallbackTime(): string {
  return new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

/**
 * 解析历史日志文件里的一行纯文本（无 ANSI、无 seq）。
 * 供日志页的历史检索模式复用 store 内的 ANSI/级别解析能力。
 */
export function parsePlainLogLine(text: string, id: number): LogEntry {
  return {
    id,
    time: fallbackTime(),
    level: detectLevel(text),
    text,
    html: ansiUp.ansi_to_html(text),
  };
}

/**
 * 解析推送报文。
 *
 * 优先解析后端 JSON 信封 {seq, time, level, text}（级别准确、可断点续传）；
 * 非信封报文按纯文本回退，级别靠正则猜测。
 */
function parsePayload(raw: string): LogEntry | null {
  try {
    const data = JSON.parse(raw) as {
      boot?: string;
      seq?: number;
      time?: string;
      level?: string;
      text?: string;
    };
    if (typeof data.text === "string") {
      const text = cleanText(data.text);
      if (!text) return null;
      // 推送流有序，直接覆盖；boot 变化说明后端重启，seq 空间重置
      if (typeof data.boot === "string" && data.boot) {
        if (data.boot !== lastBoot) {
          lastBoot = data.boot;
          lastSeq = 0;
        }
      }
      if (typeof data.seq === "number" && data.seq > 0) {
        lastSeq = data.seq;
      }
      return {
        id: seq++,
        time: data.time || fallbackTime(),
        level:
          (data.level && BACKEND_LEVEL_MAP[data.level.toUpperCase()]) ||
          detectLevel(text),
        text,
        html: ansiUp.ansi_to_html(data.text),
      };
    }
  } catch {
    // 非 JSON → 走纯文本回退
  }

  const text = cleanText(raw);
  if (!text) return null;
  return {
    id: seq++,
    time: fallbackTime(),
    level: detectLevel(text),
    text,
    html: ansiUp.ansi_to_html(raw),
  };
}

/**
 * 日志 store。
 *
 * 日志缓冲放在 store 而不是组件里：离开日志页再回来历史还在，
 * WebSocket 生命周期仍跟随页面（挂载 connect、卸载 close），
 * 与 StatusWebSocket 的约定一致，不会离页后还在后台重连。
 */
export const useLogStore = defineStore("logs", () => {
  const logs = ref<LogEntry[]>([]);
  const connection = ref<ConnectionState>("offline");

  const pending: LogEntry[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  function flush() {
    flushTimer = null;
    if (!pending.length) return;
    const list = logs.value;
    list.push(...pending);
    pending.length = 0;
    // 定长截断：超长时一次性 splice 掉头部，避免逐条 O(n) 复制
    if (list.length > MAX_LOG_ENTRIES) {
      list.splice(0, list.length - MAX_LOG_ENTRIES);
    }
  }

  function append(raw: string) {
    const entry = parsePayload(raw);
    if (!entry) return;
    pending.push(entry);
    if (!flushTimer) {
      flushTimer = setTimeout(flush, FLUSH_INTERVAL);
    }
  }

  function clear() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    pending.length = 0;
    logs.value = [];
  }

  function start() {
    logWebSocket.connect(
      (message) => append(message),
      (state) => {
        connection.value = state;
      },
      // 握手报文：token + 启动标识 + 断点；boot 与服务端一致才按 since 续传
      () =>
        buildWsHandshake(
          lastBoot ? { boot: lastBoot, since: lastSeq } : undefined,
        ),
    );
  }

  function stop() {
    logWebSocket.close();
    connection.value = "offline";
  }

  return {
    logs,
    connection,
    append,
    clear,
    start,
    stop,
  };
});
