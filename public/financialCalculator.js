/**
 * financialCalculator.js
 * 
 * FinancialCalculator
 * Clase con métodos estáticos para realizar cálculos financieros específicos.
 * Cada método se encarga de un único cómputo, siguiendo el principio de responsabilidad única.
 */
export class FinancialCalculator {
    /**
     * Calcula la suma total para un mes.
     * @param {Object} mes - Objeto que contiene ingresoLocal, ingresoExtranjera y tipoCambio.
     * @returns {number} La suma total calculada.
     */
    static getSumTotal(mes) {
      return mes.ingresoLocal + (mes.ingresoExtranjera * mes.tipoCambio);
    }
  
    /**
     * Obtiene el valor inicial a partir del primer mes.
     * @param {Array<Object>} meses - Lista de meses.
     * @returns {number} Valor inicial.
     */
    static getValorInicial(meses) {
      if (meses.length === 0) return 0;
      return FinancialCalculator.getSumTotal(meses[0]);
    }
  
    /**
     * Obtiene el valor final a partir del último mes.
     * @param {Array<Object>} meses - Lista de meses.
     * @returns {number} Valor final.
     */
    static getValorFinal(meses) {
      if (meses.length === 0) return 0;
      return FinancialCalculator.getSumTotal(meses[meses.length - 1]);
    }
  
    /**
     * Calcula el rendimiento nominal.
     * @param {number} valorInicial - Valor inicial.
     * @param {number} valorFinal - Valor final.
     * @returns {number} Rendimiento nominal.
     */
    static getRnNominal(valorInicial, valorFinal) {
      if (valorInicial === 0) return 0;
      return (valorFinal - valorInicial) / valorInicial;
    }
  
    /**
     * Calcula el factor de inflación acumulada.
     * @param {Array<Object>} meses - Lista de meses.
     * @returns {number} Factor de inflación acumulada.
     */
    static getFactorInflacion(meses) {
      return meses.reduce((acum, mes) => acum * (1 + (mes.inflacion / 100)), 1);
    }
  
    /**
     * Calcula la inflación acumulada.
     * @param {number} factorInflacion - Factor de inflación.
     * @returns {number} Inflación acumulada.
     */
    static getInflacionAcumulada(factorInflacion) {
      return factorInflacion - 1;
    }
  
    /**
     * Calcula el factor ajustado para la inflación en ingresos convertidos.
     * @param {Array<Object>} meses - Lista de meses.
     * @returns {number} Factor ajustado.
     */
    static getFactorAjustado(meses) {
      return meses.reduce((acum, mes) => {
        return acum * ((mes.variacionTC !== 0)
          ? ((1 + mes.inflacion / 100) / (1 + mes.variacionTC / 100))
          : (1 + mes.inflacion / 100));
      }, 1);
    }
  
    /**
     * Calcula la inflación acumulada ajustada.
     * @param {number} factorAjustado - Factor ajustado.
     * @returns {number} Inflación acumulada ajustada.
     */
    static getInflacionAcumuladaAjustada(factorAjustado) {
      return factorAjustado - 1;
    }
  
    /**
     * Calcula el rendimiento real.
     * @param {number} rnNominal - Rendimiento nominal.
     * @param {number} inflacionAcumulada - Inflación acumulada.
     * @returns {number} Rendimiento real.
     */
    static getRendimientoReal(rnNominal, inflacionAcumulada) {
      if (1 + inflacionAcumulada === 0) return 0;
      return ((1 + rnNominal) / (1 + inflacionAcumulada)) - 1;
    }
  
    /**
     * Calcula el poder adquisitivo real.
     * @param {number} valorFinal - Valor final.
     * @param {number} factorInflacion - Factor de inflación.
     * @returns {number} Poder adquisitivo real.
     */
    static getPoderAdquisitivo(valorFinal, factorInflacion) {
      if (factorInflacion === 0) return 0;
      return valorFinal / factorInflacion;
    }
  
    /**
     * Calcula la ganancia real.
     * @param {number} poderAdquisitivo - Poder adquisitivo real.
     * @param {number} valorInicial - Valor inicial.
     * @returns {number} Ganancia real.
     */
    static getGananciaReal(poderAdquisitivo, valorInicial) {
      return poderAdquisitivo - valorInicial;
    }
  
    /**
     * Calcula el porcentaje de ganancia real.
     * @param {number} gananciaReal - Ganancia real.
     * @param {number} valorInicial - Valor inicial.
     * @returns {number} Porcentaje de ganancia real.
     */
    static getPorcentajeGananciaReal(gananciaReal, valorInicial) {
      if (valorInicial === 0) return 0;
      return (gananciaReal / valorInicial) * 100;
    }
  }
  