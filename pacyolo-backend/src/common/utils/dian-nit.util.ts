/**
 * Utilidad oficial para calcular el Dígito de Verificación (DV) de un NIT en Colombia
 * Algoritmo Módulo 11 según el Decreto 2788 de 2004 (DIAN).
 */
export function calcularDigitoVerificacion(nit: string): number {
  const nitLimpio = nit.replace(/\D/g, '');
  if (!nitLimpio) return 0;

  const factores = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
  const longitud = nitLimpio.length;
  let suma = 0;

  for (let i = 0; i < longitud; i++) {
    const digito = parseInt(nitLimpio.charAt(longitud - 1 - i), 10);
    suma += digito * factores[i];
  }

  const residuo = suma % 11;
  if (residuo === 0 || residuo === 1) {
    return residuo;
  }
  return 11 - residuo;
}
