import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const loginAPI = (email, password) => api.post('/users/login', { email, password });
export const registerAPI = (username, email, password) => api.post('/users/register', { username, email, password });

// Files
export const uploadFileAPI = (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const getMyFilesAPI = () => api.get('/files/myfiles');
export const getSharedFilesAPI = () => api.get('/files/shared');
export const shareFileAPI = (data) => api.post('/files/share', data);
export const revokeFileAPI = (data) => api.post('/files/revoke', data);
export const verifyFileAPI = (data) => api.post('/files/verify', data);
export const getMySharesAPI = () => api.get('/files/myshares');
export const viewFileAPI = (fileId) => api.get(`/files/view/${fileId}`);
export const deleteFileAPI = (fileId) => api.delete(`/files/delete/${fileId}`);
export const getFileLogsAPI = (fileId) => api.get(`/files/logs/${fileId}`);
export const getAllLogsAPI = () => api.get('/files/alllogs');

// Download — returns a blob for browser download trigger
export const downloadFileAPI = async (fileId, filename) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/files/download/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Download failed' }));
        throw new Error(err.detail);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

export default api;
