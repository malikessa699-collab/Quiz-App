const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Central API client.
 * - Attaches the JWT token when present.
 * - Parses JSON responses consistently.
 * - Throws errors with readable messages from the backend.
 */
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem('quizcraft_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new ApiError('Network error. Please check your connection and try again.', 0, null);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = (data && data.message) || `Request failed (${response.status})`;
    if (response.status === 401) {
      localStorage.removeItem('quizcraft_token');
    }
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export { ApiError };