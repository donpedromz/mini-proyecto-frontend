import axios from "https://cdn.jsdelivr.net/npm/axios@1.7.7/+esm";
import { HTTP_TIMEOUT_MS } from "../config.js";

export const api = axios.create({
  baseURL: globalThis.location?.href ?? globalThis.document?.baseURI,
  timeout: HTTP_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
  },
  transitional: { clarifyTimeoutError: true },
});
