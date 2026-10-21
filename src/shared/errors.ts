/**
 * ResQWave Standardized Error Classes
 * Provides structured, typed error handling across services, hooks, and UI components.
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly timestamp: string;

  constructor(message: string, code = 'APP_ERROR', status?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network connection unavailable or request timed out', status = 0) {
    super(message, 'NETWORK_ERROR', status);
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message = 'User authentication required or session expired') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity = 'Resource', id?: string) {
    super(`${entity}${id ? ` with ID "${id}"` : ''} was not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends AppError {
  constructor(action = 'perform this operation') {
    super(`Insufficient privileges to ${action}`, 'PERMISSION_DENIED', 403);
    this.name = 'PermissionError';
  }
}

/**
 * Normalizes any caught error into a readable message.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred. Please try again.';
}
