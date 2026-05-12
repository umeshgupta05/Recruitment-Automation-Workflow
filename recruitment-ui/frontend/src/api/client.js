import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for consistent error handling
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

export default client;
