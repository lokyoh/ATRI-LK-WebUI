import { ElMessage, ElNotification } from "element-plus";
const showMessage = Symbol("showMessage");

interface Options {
  title?: string;
  message: string;
  customClass?: string;
  duration?: number;
  showClose?: boolean;
}

type MessageType = keyof Pick<typeof ElMessage, "success" | "warning" | "info" | "error">;
type NotifyType = keyof Pick<typeof ElNotification, "success" | "warning" | "info" | "error">;
type AllOptions = string | Options;

class KawaiiMessage {
  [showMessage](type: MessageType, options: AllOptions, single: boolean) {
    // 默认添加可爱前缀
    if (typeof options === "string") {
      options = {
        message: this.getKawaiiPrefix(type) + options,
        customClass: "kawaii-message",
      };
    } else {
      options.message = this.getKawaiiPrefix(type) + (options.message || "");
      options.customClass = "kawaii-message " + (options.customClass || "");
    }

    if (single) {
      if (document.getElementsByClassName("el-message").length === 0) {
        ElMessage[type](options);
      }
    } else {
      ElMessage[type](options);
    }
  }

  getKawaiiPrefix(type: MessageType) {
    const prefixes = {
      info: "(・ω・)ノ ",
      success: "ヽ(✿ﾟ▽ﾟ)ノ ",
      warning: "(｀∀´)Ψ ",
      error: "(；´д｀)ゞ ",
    };
    return prefixes[type] || "";
  }

  info(options: AllOptions, single = true) {
    this[showMessage]("info", options, single);
  }

  warning(options: AllOptions, single = false) {
    this[showMessage]("warning", options, single);
  }

  error(options: AllOptions, single = false) {
    this[showMessage]("error", options, single);
  }

  success(options: AllOptions | string, single = true) {
    this[showMessage]("success", options, single);
  }
}

export const message = new KawaiiMessage();

const showNotify = Symbol("showNotify");

class KawaiiNotify {
  [showNotify](type: NotifyType, options: AllOptions, single: boolean) {
    // 默认添加可爱前缀
    if (typeof options === "string") {
      options = {
        title: "提示",
        message: this.getKawaiiPrefix(type) + options,
        customClass: "kawaii-notify",
        duration: 3000,
      };
    } else {
      options.message = this.getKawaiiPrefix(type) + (options.message || "");
      options.customClass = "kawaii-notify " + (options.customClass || "");
      options.duration = options.duration || 3000;
    }

    if (single) {
      // 如果要求单例模式，先关闭所有之前的通知
      ElNotification.closeAll();
    }
    ElNotification[type](options);
  }

  getKawaiiPrefix(type: NotifyType) {
    const prefixes = {
      info: "(・ω・)ノ ",
      success: "ヽ(✿ﾟ▽ﾟ)ノ ",
      warning: "(｀∀´)Ψ ",
      error: "(；´д｀)ゞ ",
    };
    return prefixes[type] || "";
  }

  info(options: AllOptions, single = true) {
    this[showNotify]("info", options, single);
  }

  success(options: AllOptions, single = true) {
    this[showNotify]("success", options, single);
  }

  warning(options: AllOptions, single = false) {
    this[showNotify]("warning", options, single);
  }

  error(options: AllOptions, single = false) {
    this[showNotify]("error", options, single);
  }
}

export const notify = new KawaiiNotify();
