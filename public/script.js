// Definición de la clave secreta para encriptar y desencriptar en localStorage
const secretKey = "mySuperSecretKey123";

/**
 * FinancialCalculator
 * Clase con métodos estáticos para realizar cálculos financieros específicos.
 * Cada método se encarga de un único cómputo, siguiendo el principio de responsabilidad única.
 */
class FinancialCalculator {
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

/**
 * MetricsCalculator
 * Orquesta el uso de FinancialCalculator para calcular todas las métricas financieras.
 */
class MetricsCalculator {
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

/**
 * PeriodoService
 * Maneja la gestión de datos: cargar, guardar y manipular periodos en el localStorage con encriptación.
 */
class PeriodoService {
  constructor() {
    this.periodos = [];
    this.cargarPeriodos();
  }

  cargarPeriodos() {
    const encryptedData = localStorage.getItem('periodos');
    if (encryptedData) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        this.periodos = JSON.parse(decryptedData);
      } catch (err) {
        console.error("Error al desencriptar periodos:", err);
        this.periodos = [];
      }
    } else {
      this.periodos = [];
    }
  }

  guardarPeriodos() {
    try {
      const data = JSON.stringify(this.periodos);
      const encryptedData = CryptoJS.AES.encrypt(data, secretKey).toString();
      localStorage.setItem('periodos', encryptedData);
    } catch (err) {
      console.error("Error al encriptar periodos:", err);
    }
  }

  crearPeriodo(nombre) {
    const nuevoPeriodo = {
      id: Date.now().toString(),
      nombre,
      meses: [],
      fechaCreacion: new Date().toLocaleString(),
      ultimaActualizacion: new Date().toLocaleString()
    };
    this.periodos.push(nuevoPeriodo);
    this.guardarPeriodos();
    return nuevoPeriodo;
  }

  actualizarPeriodo(periodoActualizado) {
    const index = this.periodos.findIndex(p => p.id === periodoActualizado.id);
    if (index !== -1) {
      periodoActualizado.ultimaActualizacion = new Date().toLocaleString();
      this.periodos[index] = periodoActualizado;
      this.guardarPeriodos();
    }
  }

  eliminarPeriodo(id) {
    this.periodos = this.periodos.filter(p => p.id !== id);
    this.guardarPeriodos();
  }

  obtenerPeriodos() {
    return this.periodos;
  }

  obtenerPeriodoPorId(id) {
    return this.periodos.find(p => p.id === id);
  }
}

/**
 * UIManager
 * Maneja la interacción con el DOM y la comunicación entre la UI y los servicios.
 */
class UIManager {
  constructor() {
    this.periodoService = new PeriodoService();
    this.metricsCalculator = new MetricsCalculator();
    this.periodoSeleccionado = null;
    this.cacheSelectors();
    this.bindEvents();
    this.mostrarHome();
  }

  cacheSelectors() {
    this.$viewHome = document.getElementById('view-home');
    this.$viewDetalle = document.getElementById('view-detalle');
    this.$viewResultados = document.getElementById('view-resultados');
    this.$periodosLista = document.getElementById('periodos-lista');
    this.$btnNuevoPeriodo = document.getElementById('btn-nuevo-periodo');
    this.$periodoNombre = document.getElementById('periodo-nombre');
    this.$mesesLista = document.getElementById('meses-lista');
    this.$btnAgregarMes = document.getElementById('btn-agregar-mes');
    this.$btnRepetirMes = document.getElementById('btn-repetir-mes');
    this.$btnGuardarPeriodo = document.getElementById('btn-guardar-periodo');
    this.$btnVerResultados = document.getElementById('btn-ver-resultados');
    this.$btnVolverHome = document.getElementById('btn-volver-home');
    this.$metrics = document.getElementById('metrics');
    this.$btnVolverDetalle = document.getElementById('btn-volver-detalle');
    this.$btnVolverHome2 = document.getElementById('btn-volver-home2');
    this.$menuGestionPeriodos = document.getElementById('menu-gestion-periodos');
  }

  bindEvents() {
    this.$btnNuevoPeriodo.addEventListener('click', () => this.handleNuevoPeriodo());
    this.$btnAgregarMes.addEventListener('click', () => this.handleAgregarMes());
    this.$btnRepetirMes.addEventListener('click', () => this.handleRepetirMes());
    this.$btnGuardarPeriodo.addEventListener('click', () => this.handleGuardarPeriodo());
    this.$btnVerResultados.addEventListener('click', () => this.mostrarResultados());
    this.$btnVolverHome.addEventListener('click', () => this.mostrarHome());
    this.$btnVolverDetalle.addEventListener('click', () => this.mostrarDetalle());
    this.$btnVolverHome2.addEventListener('click', () => this.mostrarHome());
    this.$menuGestionPeriodos.addEventListener('click', (e) => {
      e.preventDefault();
      this.mostrarHome();
    });
  }

  mostrarHome() {
    this.$viewHome.classList.remove('hidden');
    this.$viewDetalle.classList.add('hidden');
    this.$viewResultados.classList.add('hidden');
    this.renderPeriodos();
  }

  mostrarDetalle() {
    if (!this.periodoSeleccionado) return;
    this.$viewHome.classList.add('hidden');
    this.$viewDetalle.classList.remove('hidden');
    this.$viewResultados.classList.add('hidden');
    this.$periodoNombre.textContent = "Periodo: " + this.periodoSeleccionado.nombre;
    this.renderMeses();
    this.calcularYMostrarMetricas();
  }

  mostrarResultados() {
    if (!this.periodoSeleccionado) return;
    this.$viewHome.classList.add('hidden');
    this.$viewDetalle.classList.add('hidden');
    this.$viewResultados.classList.remove('hidden');
    this.calcularYMostrarMetricas();
  }

  renderPeriodos() {
    const periodos = this.periodoService.obtenerPeriodos();
    this.$periodosLista.innerHTML = '';
    if (periodos.length === 0) {
      this.$periodosLista.innerHTML = '<p>No hay periodos creados.</p>';
      return;
    }
    periodos.forEach(periodo => {
      const card = this.createPeriodoCard(periodo);
      this.$periodosLista.appendChild(card);
    });
  }

  createPeriodoCard(periodo) {
    const ganancia = (periodo.gananciaReal !== undefined)
      ? periodo.gananciaReal.toFixed(2)
      : "N/A";
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${periodo.nombre}</h3>
      <p><strong>Meses:</strong> ${periodo.meses.length}</p>
      <p><strong>Creado:</strong> ${periodo.fechaCreacion}</p>
      <p><strong>Última actualización:</strong> ${periodo.ultimaActualizacion}</p>
      <p class="ganancia-real"><strong>Ganancia Real:</strong> ${ganancia}</p>
      <div class="acciones">
        <button onclick="uiManager.handleSeleccionarPeriodo('${periodo.id}')" aria-label="Editar Periodo">Editar</button>
        <button onclick="uiManager.handleEliminarPeriodo('${periodo.id}')" aria-label="Eliminar Periodo">Eliminar</button>
        <button onclick="uiManager.handleVerResultados('${periodo.id}')" aria-label="Ver Resultados">Resultados</button>
      </div>
    `;
    return card;
  }

  handleNuevoPeriodo() {
    const nombre = prompt("Ingrese el nombre del nuevo periodo (ej. '2024 - Q1')");
    if (!nombre) return;
    this.periodoService.crearPeriodo(nombre);
    this.renderPeriodos();
  }

  handleEliminarPeriodo(id) {
    if (confirm("¿Está seguro de eliminar este periodo?")) {
      this.periodoService.eliminarPeriodo(id);
      if (this.periodoSeleccionado && this.periodoSeleccionado.id === id) {
        this.periodoSeleccionado = null;
      }
      this.renderPeriodos();
    }
  }

  handleSeleccionarPeriodo(id) {
    this.periodoSeleccionado = this.periodoService.obtenerPeriodoPorId(id);
    if (!this.periodoSeleccionado) return;
    this.mostrarDetalle();
  }

  handleVerResultados(id) {
    this.periodoSeleccionado = this.periodoService.obtenerPeriodoPorId(id);
    if (!this.periodoSeleccionado) return;
    this.mostrarResultados();
  }

  renderMeses() {
    if (!this.periodoSeleccionado) return;
    this.$mesesLista.innerHTML = '';
    if (this.periodoSeleccionado.meses.length === 0) {
      this.$mesesLista.innerHTML = '<p>No hay meses en este periodo.</p>';
      return;
    }
    this.periodoSeleccionado.meses.forEach((mes, index) => {
      const card = this.createMesCard(mes, index);
      this.$mesesLista.appendChild(card);
    });
    this.recalcularVariaciones();
  }

  createMesCard(mes, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <label>Mes:
        <input type="text" value="${mes.mes}" onchange="uiManager.actualizarMes(${index}, 'mes', this.value)" placeholder="Ej: 04/24">
      </label>
      <label>Inflación (%):
        <input type="number" step="any" value="${mes.inflacion}" onchange="uiManager.actualizarMes(${index}, 'inflacion', this.value)" placeholder="Ej: 4.2">
      </label>
      <label>Tipo de Cambio:
        <input type="number" step="any" value="${mes.tipoCambio}" onchange="uiManager.actualizarMes(${index}, 'tipoCambio', this.value)" placeholder="Ej: 1085">
      </label>
      <label>Ingreso Local:
        <input type="number" step="any" value="${mes.ingresoLocal}" onchange="uiManager.actualizarMes(${index}, 'ingresoLocal', this.value)" placeholder="Ej: 100000">
      </label>
      <label>Ingreso Extranjero:
        <input type="number" step="any" value="${mes.ingresoExtranjera}" onchange="uiManager.actualizarMes(${index}, 'ingresoExtranjera', this.value)" placeholder="Ej: 500">
      </label>
      <p>Variación TC: ${mes.variacionTC ? mes.variacionTC.toFixed(2) : 'N/A'}%</p>
      <button onclick="uiManager.eliminarMes(${index})" aria-label="Eliminar Mes">Eliminar</button>
    `;
    return card;
  }

  handleRepetirMes() {
    if (!this.periodoSeleccionado || this.periodoSeleccionado.meses.length === 0) {
      alert("No hay datos previos para repetir.");
      return;
    }
    const ultimoMes = this.periodoSeleccionado.meses[this.periodoSeleccionado.meses.length - 1];
    const nuevoMes = {
      mes: prompt("Ingrese el identificador del nuevo mes (Ej: 05/24)", ultimoMes.mes) || "",
      inflacion: ultimoMes.inflacion,
      tipoCambio: ultimoMes.tipoCambio,
      ingresoLocal: ultimoMes.ingresoLocal,
      ingresoExtranjera: ultimoMes.ingresoExtranjera,
      variacionTC: 0
    };
    this.periodoSeleccionado.meses.push(nuevoMes);
    this.periodoService.actualizarPeriodo(this.periodoSeleccionado);
    this.renderMeses();
  }

  handleAgregarMes() {
    if (!this.periodoSeleccionado) return;
    const mesId = prompt("Ingrese el identificador del mes (Ej: 04/24)");
    if (!mesId) return;
    const nuevoMes = {
      mes: mesId,
      inflacion: 0,
      tipoCambio: 0,
      ingresoLocal: 0,
      ingresoExtranjera: 0,
      variacionTC: 0
    };
    this.periodoSeleccionado.meses.push(nuevoMes);
    this.periodoService.actualizarPeriodo(this.periodoSeleccionado);
    this.renderMeses();
  }

  actualizarMes(index, campo, valor) {
    if (!this.periodoSeleccionado) return;
    const nuevoValor = (campo === 'mes') ? valor : (isNaN(parseFloat(valor)) ? 0 : parseFloat(valor));
    this.periodoSeleccionado.meses[index][campo] = nuevoValor;
    this.recalcularVariaciones();
    this.calcularYMostrarMetricas();
    this.periodoService.actualizarPeriodo(this.periodoSeleccionado);
    this.renderMeses();
  }

  eliminarMes(index) {
    if (!this.periodoSeleccionado) return;
    this.periodoSeleccionado.meses.splice(index, 1);
    this.periodoService.actualizarPeriodo(this.periodoSeleccionado);
    this.renderMeses();
    this.calcularYMostrarMetricas();
  }

  recalcularVariaciones() {
    if (!this.periodoSeleccionado || this.periodoSeleccionado.meses.length < 2) return;
    this.periodoSeleccionado.meses.forEach((mes, index, arr) => {
      if (index === 0) {
        mes.variacionTC = 0;
      } else {
        const prev = arr[index - 1].tipoCambio;
        const curr = mes.tipoCambio;
        mes.variacionTC = prev ? ((curr - prev) / prev) * 100 : 0;
      }
    });
    this.periodoService.actualizarPeriodo(this.periodoSeleccionado);
  }

  calcularYMostrarMetricas() {
    if (!this.periodoSeleccionado || this.periodoSeleccionado.meses.length === 0) return;
    const metrics = this.metricsCalculator.calcular(this.periodoSeleccionado);
    this.periodoSeleccionado.gananciaReal = metrics.gananciaReal;
    this.periodoSeleccionado.porcentajeGananciaReal = metrics.porcentajeGananciaReal;
    this.$metrics.innerHTML = `
      <p><strong>Valor Inicial (Suma Total):</strong> ${metrics.valorInicial.toFixed(2)}</p>
      <p><strong>Valor Final (Suma Total):</strong> ${metrics.valorFinal.toFixed(2)}</p>
      <p><strong>Rendimiento Nominal Total:</strong> ${(metrics.rnNominal * 100).toFixed(2)}%</p>
      <p><strong>Inflación Acumulada (Local):</strong> ${(metrics.inflacionAcumulada * 100).toFixed(2)}%</p>
      <p><strong>Inflación Acumulada Ajustada (Ingresos Convertidos):</strong> ${(metrics.inflacionAcumuladaAjustada * 100).toFixed(2)}%</p>
      <p><strong>Rendimiento Real:</strong> ${(metrics.rendimientoReal * 100).toFixed(2)}%</p>
      <p><strong>Poder Adquisitivo Real:</strong> ${metrics.poderAdquisitivo.toFixed(2)}</p>
      <p><strong>Ganancia Real:</strong> ${metrics.gananciaReal.toFixed(2)} (${metrics.porcentajeGananciaReal.toFixed(2)}%)</p>
    `;
  }
}

const uiManager = new UIManager();
window.uiManager = uiManager;
