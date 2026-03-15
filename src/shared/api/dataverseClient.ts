import type { ODataCollectionResponse } from '@/shared/types/dataverse';
import { getClientUrl } from '@/features/auth/services/xrmContext';

export interface DataverseError {
  error: {
    code: string;
    message: string;
    innererror?: {
      message: string;
      type: string;
      stacktrace: string;
    };
  };
}

export class DataverseApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly detail: string | undefined;

  constructor(status: number, apiError: DataverseError) {
    super(apiError.error.message);
    this.name = 'DataverseApiError';
    this.status = status;
    this.code = apiError.error.code;
    this.detail = apiError.error.innererror?.message;
  }
}

/**
 * Dataverse Web API client.
 * Runs as a web resource — uses the existing Dynamics session (same-origin).
 * No tokens or app registration needed.
 */
class DataverseClient {
  private get baseUrl(): string {
    return getClientUrl();
  }

  private buildHeaders(extraHeaders?: Record<string, string>): Headers {
    return new Headers({
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'odata.include-annotations="*"',
      ...extraHeaders,
    });
  }

  private fullUrl(path: string): string {
    if (path.startsWith('http')) return path;
    if (path.startsWith('/api')) return `${this.baseUrl}${path}`;
    return `${this.baseUrl}/api/data/v9.2/${path}`;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!response.ok) {
      let apiError: DataverseError;
      try {
        apiError = JSON.parse(text) as DataverseError;
      } catch {
        apiError = {
          error: {
            code: String(response.status),
            message: text || response.statusText,
          },
        };
      }
      throw new DataverseApiError(response.status, apiError);
    }

    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  async get<T>(path: string, extraHeaders?: Record<string, string>): Promise<T> {
    const headers = this.buildHeaders(extraHeaders);
    const response = await fetch(this.fullUrl(path), {
      method: 'GET',
      headers,
    });
    return this.handleResponse<T>(response);
  }

  async getCollection<T>(path: string): Promise<T[]> {
    const result = await this.get<ODataCollectionResponse<T>>(path);
    return result.value;
  }

  async post<T>(
    path: string,
    body: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const headers = this.buildHeaders(extraHeaders);
    const response = await fetch(this.fullUrl(path), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (response.status === 204) {
      const entityId = response.headers
        .get('OData-EntityId')
        ?.match(/\(([^)]+)\)/)?.[1];
      return { id: entityId } as T;
    }
    return this.handleResponse<T>(response);
  }

  async patch(
    path: string,
    body: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<void> {
    const headers = this.buildHeaders(extraHeaders);
    const response = await fetch(this.fullUrl(path), {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    await this.handleResponse<void>(response);
  }

  async delete(path: string): Promise<void> {
    const headers = this.buildHeaders();
    const response = await fetch(this.fullUrl(path), {
      method: 'DELETE',
      headers,
    });
    await this.handleResponse<void>(response);
  }
}

/** Singleton — one client per session, reads env from Xrm context */
export const dataverseClient = new DataverseClient();
