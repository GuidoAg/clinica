import { RespuestaApi } from '../models/RespuestaApi';
import { Supabase } from '../supabase';

/**
 * Convierte un string base64 a un objeto File (tipo MIME image/png)
 */
function base64ToFile(base64: string, fileName: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], fileName, { type: mime });
}

/**
 * Convierte un objeto File (imagen) a string base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject('No se pudo leer el archivo como base64.');
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Sube una imagen en base64 al bucket 'imagenes' de Supabase
 */
export async function subirImagenDesdeBase64(
  base64: string,
  carpeta: string,
  nombreArchivo: string,
): Promise<RespuestaApi<string>> {
  try {
    const timestamp = Date.now();
    const path = `${carpeta}/${nombreArchivo}-${timestamp}.png`;

    const file = base64ToFile(base64, `${nombreArchivo}.png`);

    const { error } = await Supabase.storage
      .from('imagenes')
      .upload(path, file, {
        upsert: true,
      });

    if (error) {
      return { success: false, message: 'No se pudo subir la imagen.' };
    }

    const { data } = Supabase.storage.from('imagenes').getPublicUrl(path);

    if (!data?.publicUrl) {
      return { success: false, message: 'No se pudo obtener la URL pública.' };
    }

    return { success: true, data: data.publicUrl };
  } catch {
    return { success: false, message: 'Error inesperado al subir la imagen.' };
  }
}
