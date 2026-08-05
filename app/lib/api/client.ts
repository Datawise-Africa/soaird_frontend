import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '~/lib/env';
import { store } from '~/store';
import { clearAuth, setToken } from '~/store/slices/auth-slice';

const isDev = import.meta.env.DEV;

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Let Axios choose the request content type. In particular, a FormData
    // upload must be sent as multipart/form-data with the boundary generated
    // by the browser. A global application/json header causes uploaded Files
    // to be serialized as ordinary values, which DRF correctly rejects.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      config.headers.delete('Content-Type');
    }

    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`
      );
    }

    // Add auth token from Redux store
    const token = store.getState().auth.token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshRequest: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshRequest) {
    refreshRequest = axios
      .post<{ access: string }>(
        `${env.VITE_API_BASE_URL}/api/v1/auth/refresh/`,
        undefined,
        { withCredentials: true }
      )
      .then(({ data }) => {
        store.dispatch(setToken(data.access));
        return data.access;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (
    error: AxiosError<{
      detail?: string;
      message?: string;
      error?: { message?: string; details?: unknown };
    }>
  ) => {
    if (isDev) {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message:
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message,
      });
    }

    const request = error.config as RetryableRequest | undefined;
    const isAuthEndpoint =
      request?.url?.includes('/auth/login/') ||
      request?.url?.includes('/auth/register/') ||
      request?.url?.includes('/auth/refresh/');

    if (
      error.response?.status === 401 &&
      request &&
      !request._retry &&
      !isAuthEndpoint
    ) {
      request._retry = true;
      try {
        const access = await refreshAccessToken();
        request.headers.Authorization = `Bearer ${access}`;
        return apiClient(request);
      } catch {
        store.dispatch(clearAuth());
      }
    } else if (error.response?.status === 401 && !isAuthEndpoint) {
      store.dispatch(clearAuth());
    }

    return Promise.reject(error);
  }
);