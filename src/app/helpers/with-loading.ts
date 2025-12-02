import { WritableSignal } from "@angular/core";

export async function withLoading<T>(
  cargando: WritableSignal<boolean>,
  fn: () => Promise<T>,
): Promise<T> {
  cargando.set(true);
  try {
    return await fn();
  } finally {
    cargando.set(false);
  }
}

export async function withLoadingAndError<T>(
  cargando: WritableSignal<boolean>,
  fn: () => Promise<T>,
  onError?: (error: unknown) => void,
): Promise<T | null> {
  cargando.set(true);
  try {
    return await fn();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.error("Error en operación async:", error);
    }
    return null;
  } finally {
    cargando.set(false);
  }
}
