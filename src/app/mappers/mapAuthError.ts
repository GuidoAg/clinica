import { AuthError, isAuthApiError } from '@supabase/supabase-js';
import type { AuthErrorCode } from '../models/AuthErrorCode';

export function mapSupabaseError(error: AuthError | null): AuthErrorCode {
  if (!error) return 'Error desconocido';

  if (isAuthApiError(error)) {
    switch (error.code) {
      case 'invalid_credentials':
        return 'Email o contraseña incorrectos.';
      case 'email_not_confirmed':
        return 'Debes verificar tu email antes de poder ingresar.';
      case 'user_already_exists':
      case 'email_exists':
        return 'Ya existe una cuenta registrada con este email.';
      case 'email_address_invalid':
        return 'El email ingresado no es válido.';
      case 'unexpected_failure':
        return 'Ha ocurrido un error inesperado. Intente más tarde.';
      case 'especialista_no_validado':
        return 'Tu cuenta aún no fue validada por un administrador.';
      default:
        return 'Error desconocido. Intente nuevamente.';
    }
  }

  return 'Error desconocido';
}
