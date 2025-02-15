/**
 * metricsCalculator.js
 * 
 * MetricsCalculator
 * Orquesta el uso de FinancialCalculator para calcular todas las métricas financieras.
 */
import { FinancialCalculator } from './financialCalculator.js';

export class MetricsCalculator {
  /**
   * Calcula todas las métricas financieras para un periodo dado.
   * @param {Object} periodo - Objeto que contiene la información del periodo y sus meses.
   * @returns {Object} Objeto con las métricas calculadas.
   */
  calcular(periodo) {
    if (periodo.meses.length === 0) return {};
    const mesesConSuma = periodo.meses.map(mes => ({
      ...mes,
      sumaTotal: FinancialCalculator.getSumTotal(mes)
    }));

    const valorInicial = FinancialCalculator.getValorInicial(mesesConSuma);
    const valorFinal = FinancialCalculator.getValorFinal(mesesConSuma);
    const rnNominal = FinancialCalculator.getRnNominal(valorInicial, valorFinal);
    const factorInflacion = FinancialCalculator.getFactorInflacion(periodo.meses);
    const inflacionAcumulada = FinancialCalculator.getInflacionAcumulada(factorInflacion);
    const factorAjustado = FinancialCalculator.getFactorAjustado(periodo.meses);
    const inflacionAcumuladaAjustada = FinancialCalculator.getInflacionAcumuladaAjustada(factorAjustado);
    const rendimientoReal = FinancialCalculator.getRendimientoReal(rnNominal, inflacionAcumulada);
    const poderAdquisitivo = FinancialCalculator.getPoderAdquisitivo(valorFinal, factorInflacion);
    const gananciaReal = FinancialCalculator.getGananciaReal(poderAdquisitivo, valorInicial);
    const porcentajeGananciaReal = FinancialCalculator.getPorcentajeGananciaReal(gananciaReal, valorInicial);

    return {
      valorInicial,
      valorFinal,
      rnNominal,
      inflacionAcumulada,
      inflacionAcumuladaAjustada,
      rendimientoReal,
      poderAdquisitivo,
      gananciaReal,
      porcentajeGananciaReal
    };
  }
}
