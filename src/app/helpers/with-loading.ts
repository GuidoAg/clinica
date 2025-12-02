import { WritableSignal } from "@angular/core";

/**
 * Helper para manejar el estado de carga automáticamente
 * Ejecuta una función asíncrona mientras actualiza un signal de cargando
 *
 * ✨ Point 8: Optimización del flag de carga
 *
 * @param cargando - WritableSignal<boolean> que controla el estado de carga
 * @param fn - Función asíncrona a ejecutar
 * @returns Promise con el resultado de la función
 *
 * @example
 * ```typescript
 * // Antes:
 * async cargarDatos() {
 *   this.cargando.set(true);
 *   try {
 *     const datos = await this.service.obtenerDatos();
 *     // ...procesar datos
 *   } finally {
 *     this.cargando.set(false);
 *   }
 * }
 *
 * // Después:
 * async cargarDatos() {
 *   await withLoading(this.cargando, async () => {
 *     const datos = await this.service.obtenerDatos();
 *     // ...procesar datos
 *   });
 * }
 * ```
 */
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

/**
 * Variante que permite manejar errores de forma personalizada
 *
 * @param cargando - WritableSignal<boolean> que controla el estado de carga
 * @param fn - Función asíncrona a ejecutar
 * @param onError - Callback opcional para manejar errores
 * @returns Promise con el resultado o null si hubo error
 *
 * @example
 * ```typescript
 * async guardarDatos() {
 *   await withLoadingAndError(
 *     this.cargando,
 *     async () => {
 *       await this.service.guardar(this.datos);
 *       this.mensaje.set('Guardado exitoso');
 *     },
 *     (error) => {
 *       this.mensaje.set('Error al guardar');
 *       console.error(error);
 *     }
 *   );
 * }
 * ```
 */
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
