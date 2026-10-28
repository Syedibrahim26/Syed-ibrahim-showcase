import { User, Profile, Project, Message, DashboardStats } from '../types';

const TOKEN_KEY = 'portfolio_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg) as any;
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    getMe: () => request<{ user: User }>('/api/auth/me'),
    logout: () => {
      setStoredToken(null);
      return request('/api/auth/logout', { method: 'POST' });
    }
  },

  profile: {
    get: () => request<Profile>('/api/profile'),
    update: (data: Partial<Profile>) =>
      request<{ success: boolean; message: string; profile: Profile }>('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  account: {
    update: (data: { email?: string; name?: string; currentPassword?: string; newPassword?: string }) =>
      request<{ success: boolean; message: string; user: User; token: string }>('/api/admin/account', {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  projects: {
    getPublished: () => request<Project[]>('/api/projects'),
    getById: (id: number) => request<Project>(`/api/projects/${id}`),
    getAllAdmin: () => request<Project[]>('/api/admin/projects'),
    create: (data: Partial<Project>) =>
      request<{ success: boolean; message: string; project: Project }>('/api/admin/projects', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: number, data: Partial<Project>) =>
      request<{ success: boolean; message: string; project: Project }>(`/api/admin/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    toggleVisibility: (id: number) =>
      request<{ success: boolean; is_published: boolean; message: string }>(`/api/admin/projects/${id}/visibility`, {
        method: 'PATCH'
      }),
    delete: (id: number) =>
      request<{ success: boolean; message: string }>(`/api/admin/projects/${id}`, {
        method: 'DELETE'
      })
  },

  messages: {
    submit: (data: { name: string; email: string; phone?: string; subject?: string; message: string }) =>
      request<{ success: boolean; message: string }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getAll: () => request<Message[]>('/api/admin/messages'),
    toggleRead: (id: number) =>
      request<{ success: boolean; is_read: boolean }>(`/api/admin/messages/${id}/read`, {
        method: 'PATCH'
      }),
    delete: (id: number) =>
      request<{ success: boolean; message: string }>(`/api/admin/messages/${id}`, {
        method: 'DELETE'
      })
  },

  stats: {
    get: () => request<DashboardStats>('/api/admin/stats')
  },

  upload: {
    uploadImage: (image: string, filename?: string) =>
      request<{ success: boolean; url: string }>('/api/admin/upload', {
        method: 'POST',
        body: JSON.stringify({ image, filename })
      }),
    uploadResume: (file: string) =>
      request<{ success: boolean; url: string }>('/api/admin/upload-resume', {
        method: 'POST',
        body: JSON.stringify({ file })
      })
  },

  admin: {
    seedDemo: () => request<{ success: boolean; message: string }>('/api/admin/seed-demo', { method: 'POST' })
  }
};
