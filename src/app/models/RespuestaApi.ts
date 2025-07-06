export interface RespuestaApi<T> {
  success: boolean;
  data?: T;
  message?: string;
}
