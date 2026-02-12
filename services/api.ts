import { API_URL } from "@/constants/api";
import { getAccessToken } from "@/services/auth";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiFetchOptions = {
  auth?: boolean;
};

const parseErrorMessage = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const json = await response.json();
      if (typeof json?.detail === "string") return json.detail;
      if (typeof json?.message === "string") return json.message;
    } catch {
      return `Request failed (${response.status})`;
    }
  }

  try {
    const text = await response.text();
    if (text) return text;
  } catch {
    return `Request failed (${response.status})`;
  }

  return `Request failed (${response.status})`;
};

export const apiFetch = async (
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = { auth: true }
) => {
  const headers = new Headers(init.headers ?? {});

  if (options.auth !== false) {
    const token = await getAccessToken();
    if (!token) {
      throw new ApiError("Authentication required", 401);
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  return response;
};

export const toAbsoluteApiUrl = (pathOrUrl: string) => {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const trimmedBase = API_URL.replace(/\/+$/, "");
  const trimmedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${trimmedBase}${trimmedPath}`;
};
