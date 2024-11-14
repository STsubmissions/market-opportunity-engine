import axios, { AxiosError, AxiosRequestConfig } from 'axios';

interface RetryConfig extends AxiosRequestConfig {
  retry?: number;
  retryDelay?: number;
  retryCount?: number;
}

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 30000,
});

// Add request interceptor for API key
api.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('seranking_api_key');
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  return config;
});

// Add response interceptor for retries
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;
    
    // If config does not exist or retry option is not set, reject
    if (!config || !config.retry) return Promise.reject(error);

    // Set the variable for keeping track of the retry count
    config.retryCount = config.retryCount ?? 0;

    // Check if we've maxed out the total number of retries
    if (config.retryCount >= config.retry) {
      // Reject with the error
      return Promise.reject(error);
    }

    // Increase the retry count
    config.retryCount += 1;

    // Create new promise to handle exponential backoff
    const backoff = new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, config.retryDelay ?? 1000 * Math.pow(2, config.retryCount - 1));
    });

    // Return the promise in which recalls axios to retry the request
    await backoff;
    return api(config);
  }
);

interface RequestOptions {
  retry?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export const makeRequest = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any,
  options: RequestOptions = {}
): Promise<T> => {
  const {
    retry = 3,
    retryDelay = 1000,
    cache = false,
    cacheTTL = 3600000, // 1 hour
  } = options;

  // Check cache if enabled
  if (cache && method === 'get') {
    const cachedData = localStorage.getItem(`cache:${url}`);
    if (cachedData) {
      const { data: cached, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < cacheTTL) {
        return cached;
      }
    }
  }

  try {
    const config: RetryConfig = {
      method,
      url,
      data,
      retry,
      retryDelay,
    };

    const response = await api(config);

    // Cache the response if enabled
    if (cache && method === 'get') {
      localStorage.setItem(
        `cache:${url}`,
        JSON.stringify({
          data: response.data,
          timestamp: Date.now(),
        })
      );
    }

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      // Handle specific error cases
      switch (error.response?.status) {
        case 401:
          throw new Error('Unauthorized. Please check your API key.');
        case 403:
          throw new Error('Forbidden. You do not have access to this resource.');
        case 429:
          throw new Error('Rate limit exceeded. Please try again later.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(error.message);
      }
    }
    throw error;
  }
};

// Utility functions for common requests
export const get = <T>(url: string, options?: RequestOptions) =>
  makeRequest<T>('get', url, undefined, options);

export const post = <T>(url: string, data: any, options?: RequestOptions) =>
  makeRequest<T>('post', url, data, options);

export const put = <T>(url: string, data: any, options?: RequestOptions) =>
  makeRequest<T>('put', url, data, options);

export const del = <T>(url: string, options?: RequestOptions) =>
  makeRequest<T>('delete', url, undefined, options);

// API endpoints
export const api_endpoints = {
  analyze: '/moe/analyze',
  domainOverview: (domain: string) => `/moe/domain/${domain}/overview`,
  opportunities: (domain: string) => `/moe/domain/${domain}/opportunities`,
  clusterKeywords: '/moe/cluster-keywords',
};

export default api;
