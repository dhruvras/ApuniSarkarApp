export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5001';

/**
 * Universal API client for Apuni Sarkar 2.0 backend
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`API request failed [${endpoint}]:`, error);
    return {
      ok: false,
      status: 0,
      data: { message: error instanceof Error ? error.message : 'Network request failed' },
    };
  }
}

