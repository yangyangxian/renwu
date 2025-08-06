import { ApiResponse, ApiErrorResponse, ErrorCodes } from '@fullstack/common';
import { API_BASE_URL } from '../appConfig.js';
import logger from '../utils/logger.js';
import { getErrorMessage } from '../resources/errorMessages.js';
import { toast } from 'sonner';

// Prevent multiple concurrent internal error toasts
let internalErrorToastActive = false;

export class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async get<TResponse>(
    endpoint: string,
    queryParams?: Record<string, string>
  ): Promise<TResponse> {
    return this.makeRequest<void, TResponse>(endpoint, 'GET', undefined, queryParams);
  }

  async post<TRequestBody, TResponse>(
    endpoint: string,
    requestBody: TRequestBody,
    queryParams?: Record<string, string>
  ): Promise<TResponse> {
    return this.makeRequest<TRequestBody, TResponse>(endpoint, 'POST', requestBody, queryParams);
  }

  async put<TRequestBody, TResponse>(
    endpoint: string,
    requestBody: TRequestBody,
    queryParams?: Record<string, string>
  ): Promise<TResponse> {
    return this.makeRequest<TRequestBody, TResponse>(endpoint, 'PUT', requestBody, queryParams);
  }

  async delete<TResponse = void>(
    endpoint: string,
    queryParams?: Record<string, string>
  ): Promise<TResponse> {
    return this.makeRequest<void, TResponse>(endpoint, 'DELETE', undefined, queryParams);
  }

  private makeRequest<TRequestBody, TResponse>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    requestBody?: TRequestBody,
    queryParams?: Record<string, string>
  ): Promise<TResponse> {
    let url = `${this.baseURL}${endpoint}`;
    if (queryParams) {
      const searchParams = new URLSearchParams(queryParams);
      url += `?${searchParams.toString()}`;
    }

    logger.info(`${method} request to: ${url}`, requestBody || '');

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // This ensures cookies are sent with requests
    };

    if (requestBody && method !== 'GET') {
      requestOptions.body = JSON.stringify(requestBody);
    }

    return fetch(url, requestOptions).then(
      async response => {
        // Show toast for internal server error
        if (response.status === 500 && !internalErrorToastActive) {
          internalErrorToastActive = true;
          toast.error(getErrorMessage(ErrorCodes.INTERNAL_ERROR, "Internal server error. Please try again later."));
          setTimeout(() => {
            internalErrorToastActive = false;
          }, 2000); // 2 seconds, adjust as needed
        }
        return this.handleResponse<TResponse>(response, url);
      },
      error => {
        // Handle network errors (server down, no internet, CORS, etc.)
        logger.error(`Network error for ${method} ${url}:`, error);
        throw {
          code: ErrorCodes.NETWORK_ERROR,
          message: getErrorMessage(ErrorCodes.NETWORK_ERROR),
          timestamp: new Date().toISOString()
        } as ApiErrorResponse;
      }
    );
  }

  private async handleResponse<T>(response: Response, url?: string): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (errorData && errorData.error) {
        // Throw the ApiErrorResponse directly
        throw errorData.error as ApiErrorResponse;
      }
      // Fallback error if response is not in our expected format
      throw {
        code: ErrorCodes.HTTP_ERROR,
        message: getErrorMessage(ErrorCodes.HTTP_ERROR, `HTTP error! status: ${response.status}`),
        timestamp: new Date().toISOString()
      } as ApiErrorResponse;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const apiResponse: ApiResponse<T> = await response.json();
    logger.info(`Received response from ${url}:`, apiResponse);

    if (apiResponse.error) {
      // Handle cases where the API signals failure in its own structure, even with a 2xx HTTP status
      throw apiResponse.error;
    } else if (apiResponse.data !== undefined) {
      // Return the data even if it's null (null is a valid response for some endpoints)
      return apiResponse.data as T;
    } else {
      throw {
        code: ErrorCodes.NO_DATA,
        message: getErrorMessage(ErrorCodes.NO_DATA),
        timestamp: new Date().toISOString()
      } as ApiErrorResponse;
    }
  }
}

export const apiClient = new APIClient();
