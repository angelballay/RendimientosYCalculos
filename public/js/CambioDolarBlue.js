// CambioDolarBlue.js
import { ApiClient } from './ApiClient.js';
import { CalculationTypes, DEFAULT_DAY_FOR_DATE, DEFAULT_DAY_FOR_PERIOD, BASE_URL } from './constants.js';

class CambioDolarBlue extends ApiClient {
  constructor() {
    super(BASE_URL);
  }

  /**
   * Obtiene el tipo de cambio (oficial y blue) para una fecha determinada.
   * Si la fecha no se pasa o es inválida, se utiliza por defecto el día DEFAULT_DAY_FOR_DATE.
   * La respuesta incluye la fecha formateada como "MM/YY".
   *
   * @param {string} fecha - Fecha en formato 'YYYY-MM-DD'.
   * @returns {Promise<object>} Objeto con datos de 'oficial' y 'blue' y la fecha formateada.
   * @throws {Error} Si ocurre un error en la petición.
   */
  async obtenerCambioPorFecha(fecha) {
    let fechaValida = fecha;
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      fechaValida = `${year}-${month}-${DEFAULT_DAY_FOR_DATE}`;
    }
    try {
      const data = await this.get(`/historical?day=${fechaValida}`);
      const [year, month] = fechaValida.split("-");
      return { fecha: `${month}/${year.slice(-2)}`, ...data };
    } catch (error) {
      throw new Error(`Error al obtener datos para la fecha ${fechaValida}: ${error.message}`);
    }
  }

  /**
   * Obtiene el tipo de cambio para un período de tiempo determinado.
   *
   * Se puede calcular de dos formas:
   * - CalculationTypes.PROMEDIO: Se obtienen todos los días del mes y se calcula el promedio.
   * - CalculationTypes.DIA: Se obtiene el dato de un día específico del mes.
   *
   * Si el parámetro tipoCalculo no es válido, se usará por defecto CalculationTypes.PROMEDIO.
   * Si en modo "dia" el día elegido es inválido (fuera del rango 1-28), se utilizará DEFAULT_DAY_FOR_PERIOD.
   *
   * La respuesta de cada mes muestra la fecha formateada como "MM/YY".
   *
   * @param {string} mesInicio - Mes inicial en formato 'YYYY-MM'.
   * @param {string} mesFin - Mes final en formato 'YYYY-MM'.
   * @param {string} tipoCalculo - Tipo de cálculo ('promedio' o 'dia').
   * @param {number} [diaElegido=DEFAULT_DAY_FOR_PERIOD] - Día del mes a utilizar (entre 1 y 28, para modo "dia").
   * @returns {Promise<Array<object>>} Array de objetos con la información mensual.
   * @throws {Error} En caso de parámetros inválidos o error en la obtención de datos.
   */
  async obtenerCambioPeriodo(mesInicio, mesFin, tipoCalculo, diaElegido = parseInt(DEFAULT_DAY_FOR_PERIOD, 10)) {
    if (!/^\d{4}-\d{2}$/.test(mesInicio) || !/^\d{4}-\d{2}$/.test(mesFin)) {
      throw new Error("El formato de mes debe ser 'YYYY-MM'");
    }
    if (tipoCalculo !== CalculationTypes.PROMEDIO && tipoCalculo !== CalculationTypes.DIA) {
      tipoCalculo = CalculationTypes.PROMEDIO;
    }
    if (tipoCalculo === CalculationTypes.DIA && (diaElegido < 1 || diaElegido > 28)) {
      diaElegido = parseInt(DEFAULT_DAY_FOR_PERIOD, 10);
    }

    const [anioInicio, mesInicioNum] = mesInicio.split("-").map(Number);
    const [anioFin, mesFinNum] = mesFin.split("-").map(Number);
    const resultados = [];
    const fechaIteracion = new Date(anioInicio, mesInicioNum - 1, 1);
    const fechaFin = new Date(anioFin, mesFinNum - 1, 1);

    while (fechaIteracion <= fechaFin) {
      const anioActual = fechaIteracion.getFullYear();
      const mesActual = (fechaIteracion.getMonth() + 1).toString().padStart(2, '0');
      const mesString = `${anioActual}-${mesActual}`;

      try {
        if (tipoCalculo === CalculationTypes.DIA) {
          const dia = diaElegido.toString().padStart(2, '0');
          const fechaConsulta = `${mesString}-${dia}`;
          const data = await this.obtenerCambioPorFecha(fechaConsulta);
          resultados.push({
            mes: `${mesActual}/${anioActual.toString().slice(-2)}`,
            fecha: `${mesActual}/${anioActual.toString().slice(-2)}`,
            ...data,
          });
        } else if (tipoCalculo === CalculationTypes.PROMEDIO) {
          const diasDelMes = new Date(anioActual, parseInt(mesActual, 10), 0).getDate();
          const endpoints = [];
          for (let d = 1; d <= diasDelMes; d++) {
            const dia = d.toString().padStart(2, '0');
            endpoints.push(`/historical?day=${mesString}-${dia}`);
          }
          const datosDiarios = await this.batchGet(endpoints);
          const datosValidos = datosDiarios.filter(
            (item) => item && item.oficial && item.blue
          );
          if (datosValidos.length === 0) {
            throw new Error(`No se obtuvieron datos válidos para el mes ${mesString}`);
          }
          const promedio = this._calcularPromedio(datosValidos);
          resultados.push({
            mes: `${mesActual}/${anioActual.toString().slice(-2)}`,
            diasAnalizados: datosValidos.length,
            ...promedio,
          });
        }
      } catch (error) {
        throw new Error(`Error en el mes ${mesString}: ${error.message}`);
      }
      fechaIteracion.setMonth(fechaIteracion.getMonth() + 1);
    }

    return resultados;
  }

  /**
   * Calcula el promedio de los datos diarios.
   * @param {Array<object>} datosDiarios - Array de datos diarios con estructura:
   * { oficial: { value_buy, value_avg, value_sell }, blue: { value_buy, value_avg, value_sell } }
   * @returns {object} Objeto con promedios para 'oficial' y 'blue'.
   */
  _calcularPromedio(datosDiarios) {
    const suma = {
      oficial: { value_buy: 0, value_avg: 0, value_sell: 0 },
      blue: { value_buy: 0, value_avg: 0, value_sell: 0 },
    };
    const count = datosDiarios.length;
    datosDiarios.forEach((item) => {
      suma.oficial.value_buy += item.oficial.value_buy;
      suma.oficial.value_avg += item.oficial.value_avg;
      suma.oficial.value_sell += item.oficial.value_sell;
      suma.blue.value_buy += item.blue.value_buy;
      suma.blue.value_avg += item.blue.value_avg;
      suma.blue.value_sell += item.blue.value_sell;
    });
    return {
      oficial: {
        value_buy: suma.oficial.value_buy / count,
        value_avg: suma.oficial.value_avg / count,
        value_sell: suma.oficial.value_sell / count,
      },
      blue: {
        value_buy: suma.blue.value_buy / count,
        value_avg: suma.blue.value_avg / count,
        value_sell: suma.blue.value_sell / count,
      },
    };
  }
}

export default CambioDolarBlue;
