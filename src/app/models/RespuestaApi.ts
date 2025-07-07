import { AuthErrorCode } from './AuthErrorCode';

export interface RespuestaApi<T> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: AuthErrorCode;
}
