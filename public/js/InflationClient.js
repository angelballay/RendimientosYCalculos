// InflationClient.js
import { ApiClient } from "./ApiClient.js";

// URL base de la API del BCRA
const INFLATION_BASE_URL = "https://api.bcra.gob.ar";

export class InflationClient extends ApiClient {
  constructor() {
    super(INFLATION_BASE_URL);
  }

  /**
   * Obtiene la inflación por fecha.
   * Realiza una petición GET a:
   * https://api.bcra.gob.ar/estadisticas/v3.0/Monetarias/27?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
   *
   * @param {string} desde - Fecha inicial en formato "YYYY-MM-DD".
   * @param {string} hasta - Fecha final en formato "YYYY-MM-DD".
   * @returns {Promise<Array<Object>>} - Array de objetos, cada uno con "fecha" y "valor" (la inflación del mes).
   * @throws {Error} En caso de error en la petición.
   */
  async obtenerInflacionPorFecha(desde, hasta) {
    const endpoint = `/estadisticas/v3.0/Monetarias/27?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`;
    try {
      const response = await this.get(endpoint);
      // Se asume que la respuesta tiene la propiedad "results"
      return response.results;
    } catch (error) {
      throw new Error(`Error al obtener la inflación: ${error.message}`);
    }
  }
}
