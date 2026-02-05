// Centralized API client with consistent error handling

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * Unified fetch wrapper with automatic JSON handling and error management
 *
 * @example
 * // GET request
 * const dishes = await apiFetch<Dish[]>('/api/dishes');
 *
 * // POST request
 * const result = await apiFetch<{ id: number }>('/api/dishes', {
 *   method: 'POST',
 *   body: { name: 'Schnitzel', category: 'fleisch' }
 * });
 */
export async function apiFetch<T>(url: string, options?: ApiFetchOptions): Promise<T> {
  const { body, headers, ...rest } = options || {};

  const fetchOptions: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  // Try to parse JSON response
  let data: unknown;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  // Handle error responses
  if (!response.ok) {
    const errorMessage =
      (data && typeof data === 'object' && 'error' in data)
        ? String((data as { error: string }).error)
        : `HTTP ${response.status}: ${response.statusText}`;

    throw new ApiError(errorMessage, response.status, data);
  }

  return data as T;
}

/**
 * Safe fetch that returns { data, error } instead of throwing
 * Useful for components that want to handle errors inline
 *
 * @example
 * const { data, error } = await apiFetchSafe<Dish[]>('/api/dishes');
 * if (error) {
 *   setError(error.message);
 * } else {
 *   setDishes(data);
 * }
 */
export async function apiFetchSafe<T>(
  url: string,
  options?: ApiFetchOptions
): Promise<{ data: T; error: null } | { data: null; error: ApiError }> {
  try {
    const data = await apiFetch<T>(url, options);
    return { data, error: null };
  } catch (err) {
    if (err instanceof ApiError) {
      return { data: null, error: err };
    }
    // Network errors or other issues
    return {
      data: null,
      error: new ApiError(
        err instanceof Error ? err.message : 'Netzwerkfehler',
        0
      )
    };
  }
}

// Convenience methods
export const api = {
  get: <T>(url: string) => apiFetch<T>(url),

  post: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: 'POST', body }),

  put: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: 'PUT', body }),

  delete: <T>(url: string) =>
    apiFetch<T>(url, { method: 'DELETE' }),
};
