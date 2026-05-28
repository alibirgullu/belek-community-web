import axios from 'axios';
import type { AxiosError, AxiosRequestConfig } from 'axios';

const BASE_URL = 'http://localhost:5267/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('sksAdminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 401 yakalandığında refresh token ile sessiz yenileme. Eşzamanlı 401'ler tek refresh çağrısını paylaşır.
let refreshPromise: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('sksAdminRefreshToken');
    if (!refreshToken) return null;

    try {
        // Interceptor'sız ayrı bir axios çağrısı — yoksa kendi 401'i sonsuz döngü yapar.
        const response = await axios.post(`${BASE_URL}/users/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = response.data;
        if (!accessToken || !newRefresh) return null;

        localStorage.setItem('sksAdminToken', accessToken);
        localStorage.setItem('sksAdminRefreshToken', newRefresh);
        return accessToken;
    } catch (_err) {
        localStorage.removeItem('sksAdminToken');
        localStorage.removeItem('sksAdminRefreshToken');
        localStorage.removeItem('sksAdminUser');
        // Yönetim paneli oturumu sonlandı — login sayfasına gönder.
        if (window.location.pathname !== '/') {
            window.location.assign('/');
        }
        return null;
    }
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

        if (
            !originalRequest ||
            error.response?.status !== 401 ||
            originalRequest._retry ||
            originalRequest.url?.includes('/users/refresh') ||
            originalRequest.url?.includes('/users/login')
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (!refreshPromise) {
            refreshPromise = performRefresh().finally(() => {
                refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;
        if (!newToken) return Promise.reject(error);

        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as any).Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
    }
);

export default api;
