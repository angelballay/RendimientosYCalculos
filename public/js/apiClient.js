export class ApiClient {
    /**
     * @param {string} baseUrl - URL base para la API.
     * @param {object} defaultOptions - Opciones por defecto (por ejemplo, headers comunes).
     */
    constructor(baseUrl = '', defaultOptions = {}) {
      this.baseUrl = baseUrl;
      this.defaultOptions = defaultOptions;
    }
  
    /**
     * Método genérico para realizar peticiones HTTP.
     * @param {string} method - Método HTTP (GET, POST, PUT, PATCH, DELETE).
     * @param {string} endpoint - Endpoint o ruta de la API.
     * @param {object|null} data - Datos a enviar (para POST, PUT, PATCH).
     * @param {object} options - Opciones adicionales (por ejemplo, headers).
     * @returns {Promise<any>} - Respuesta parseada como JSON.
     */
    async request(method, endpoint, data = null, options = {}) {
      const url = `${this.baseUrl}${endpoint}`;
  
      // Fusionamos headers por defecto y los que se pasen por parámetro.
      const headers = {
        'Content-Type': 'application/json',
        ...this.defaultOptions.headers,
        ...options.headers,
      };
  
      const config = {
        method,
        headers,
        // Se permite sobreescribir o agregar otras opciones (como mode, credentials, etc.)
        ...this.defaultOptions,
        ...options,
      };
  
      if (data) {
        config.body = JSON.stringify(data);
      }
  
      try {
        const response = await fetch(url, config);
        if (!response.ok) {
          // Puedes ampliar la gestión de errores según tus necesidades.
          throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
        }
        // Asumimos que la respuesta es JSON.
        return await response.json();
      } catch (error) {
        // Propagamos el error para que el consumidor pueda manejarlo.
        throw error;
      }
    }
  
    async get(endpoint, options = {}) {
      return this.request('GET', endpoint, null, options);
    }
  
    async post(endpoint, data, options = {}) {
      return this.request('POST', endpoint, data, options);
    }
  
    async put(endpoint, data, options = {}) {
      return this.request('PUT', endpoint, data, options);
    }
  
    /**
     * Método update implementado como PATCH para actualizaciones parciales.
     */
    async update(endpoint, data, options = {}) {
      return this.request('PATCH', endpoint, data, options);
    }
  
    async delete(endpoint, options = {}) {
      return this.request('DELETE', endpoint, null, options);
    }
  
    /**
     * Permite realizar múltiples peticiones GET en paralelo.
     * @param {Array<string>} endpoints - Array de endpoints a consultar.
     * @param {object} options - Opciones adicionales para cada petición.
     * @returns {Promise<Array<any>>} - Array con las respuestas de cada GET.
     */
    async batchGet(endpoints, options = {}) {
      const promises = endpoints.map(endpoint => this.get(endpoint, options));
      return Promise.all(promises);
    }
  }