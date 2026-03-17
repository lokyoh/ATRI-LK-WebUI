import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import router from "../router";
import { message } from "@/utils/message";

// 类型定义
interface ResponseData<T = unknown> {
  status?: number;
  info?: string;
  message?: string;
  detail?: string | Array<{ msg: string }>;
  data?: T;
  [key: string]: unknown;
}

interface ErrorResponse {
  response?: {
    status: number;
    data: ResponseData;
  };
  request?: unknown;
  message?: string;
}

// 请求拦截器
axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getCookie("tokenStr");
    if (token) {
      // 请求携带自定义token
      config.headers["Authorization"] = token;
    }
    return config;
  },
  (error: unknown) => {
    console.log(error);
    return Promise.reject(error);
  },
);

// 响应拦截器
axios.interceptors.response.use(
  (success: AxiosResponse<ResponseData>) => {
    const { status, data } = success;

    // 业务逻辑错误
    if (status === 200) {
      // 检查业务状态码
      if (data.status && [500, 999, 998].includes(data.status)) {
        message.error(data.info || "业务处理错误");
        return Promise.reject(data);
      }
      // 返回整个 response 对象，而不是 success.data
      return success;
    }

    return success;
  },
  (error: ErrorResponse) => {
    try {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 504 || status === 404) {
          message.error("服务器被吃了┭┮﹏┭┮");
        } else if (status === 405) {
          message.error("真寻的api地址不正确捏");
        } else if (status === 400) {
          if (data.detail) {
            message.error(String(data.detail));
          }

          const path = router.currentRoute.value.path;
          if (path !== "/") {
            router.replace("/");
          }
        } else {
          if (data?.detail) {
            if (Array.isArray(data.detail) && data.detail[0]?.msg) {
              message.error(data.detail[0].msg);
            } else if (typeof data.detail === "string") {
              message.error(data.detail);
            } else {
              message.error("发生错误啦!");
            }
          } else {
            message.error("发生错误啦!");
          }
        }
      } else if (error.request) {
        message.error("网络连接好像不通畅哦，请检查服务器与地址设置...");
      } else {
        message.error(error.message || "未知错误");
      }
    } catch (e) {
      console.error("响应拦截器处理错误:", e);
      message.error("处理响应时发生错误");
    }

    return Promise.reject(error);
  },
);

let baseApiUrl: string = "http://localhost";

export const getBaseUrl = (): string => {
  return getBaseApiUrl() + ":" + getPort();
};

export const setPort = (port: string): void => {
  localStorage.setItem("port", port);
};

export const getPort = (): string => {
  return localStorage.getItem("port") || "20000";
};

export const setBaseApiUrl = (url: string): void => {
  if (url && (url[url.length - 1] === "/" || url[url.length - 1] === "\\")) {
    url = url.slice(0, -1);
  }

  if (url && url !== "") {
    baseApiUrl = url;
    setBaseUrlLocalStorage(baseApiUrl);
  } else {
    baseApiUrl = "http://localhost";
    setBaseUrlLocalStorage(baseApiUrl);
    setPort("20000");
  }
};

export const getBaseApiUrl = (): string => {
  return baseApiUrl;
};

// 通用请求函数
const buildUrl = (url: string): string => {
  if (!url.startsWith("http")) {
    return `${getBaseUrl()}${url}`;
  }
  return url;
};

// 传送json格式的post请求
export const postRequest = (url: string, params?: unknown) => {
  return axios({
    method: "post",
    url: buildUrl(url),
    data: params,
  });
};

// 传递json的put请求
export const putRequest = (url: string, params?: unknown) => {
  return axios({
    method: "put",
    url: buildUrl(url),
    data: params,
  });
};

// 传递json的get请求
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getRequest = (url: string, params?: any) => {
  let finalUrl = url;

  if (params && Object.keys(params).length) {
    const queryParams: string[] = [];

    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value != null) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
          });
        } else {
          queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
      }
    });

    if (queryParams.length) {
      finalUrl += (finalUrl.includes("?") ? "&" : "?") + queryParams.join("&");
    }
  }
  return axios({
    method: "get",
    url: buildUrl(finalUrl),
  });
};

// 传递json的delete请求
export const deleteRequest = (url: string, params?: unknown) => {
  return axios({
    method: "delete",
    url: buildUrl(url),
    data: params,
  });
};

// 设置localStorage
export const setBaseUrlLocalStorage = (value: string): void => {
  localStorage.setItem("baseUrl", value);
};

// 取出localStorage
export const getBaseUrlLocalStorage = (): string | null => {
  return localStorage.getItem("baseUrl");
};

// 设置cookie方法
export const setCookie = (name: string, value: string, days: number = 7): void => {
  const exp = new Date();
  exp.setTime(exp.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${exp.toUTCString()};path=/`;
};

// 获取cookie方法
export const getCookie = (name: string): string | null => {
  const reg = new RegExp(`(^| )${name}=([^;]*)(;|$)`);
  const match = document.cookie.match(reg);
  return match?.[2] ? decodeURIComponent(match[2]) : null;
};

export const clearCookie = (name: string): void => {
  setCookie(name, "", -1);
};
