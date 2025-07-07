export type KnownAuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'email_exists'
  | 'email_address_invalid'
  | 'user_already_exists'
  | 'especialista_no_validado'
  | 'unexpected_failure';

export type AuthErrorCode = KnownAuthErrorCode | string;
