/**
 * uiManager.js
 * 
 * Orquestador principal: Maneja la interacción general con el DOM,
 * delegando responsabilidades a módulos especializados.
 */
import { PeriodoService } from "./periodoService.js";
import { MetricsCalculator } from "./metricsCalculator.js";
import { ExchangeAutoFillUI } from "./js/exchangeAutoFillUI.js";
import { PeriodListUI } from "./PeriodListUI.js";
import { PeriodDetailUI } from "./PeriodDetailUI.js";
import { ModalManager } from "./ModalManager.js";
import InflationAutoFillUI from "./js/InflationAutoFillUI.js";

export class UIManager {
  constructor() {
    this.periodoService = new PeriodoService();
    this.metricsCalculator = new MetricsCalculator();
    this.periodoSeleccionado = null;
    this.isEditingTable = false;

    this.cacheSelectors();
    this.bindEvents();

    // Instancias de UI especializadas
    this.autoExchangeUI = new ExchangeAutoFillUI(this);
    this.autoInflationUI = new InflationAutoFillUI(this);
    this.periodListUI = new PeriodListUI(this);
    this.periodDetailUI = new PeriodDetailUI(this);
    this.modalManager = new ModalManager(this);

    this.mostrarHome();
  }

  cacheSelectors() {
    this.$viewHome = document.getElementById("view-home");
    this.$viewDetalle = document.getElementById("view-detalle");
    this.$viewResultados = document.getElementById("view-resultados");
    this.$periodosLista = document.getElementById("periodos-lista");
    this.$btnNuevoPeriodo = document.getElementById("btn-nuevo-periodo");
    this.$periodoNombre = document.getElementById("periodo-nombre");
    this.$periodoDates = document.getElementById("periodo-hasta");
    this.$mesesLista = document.getElementById("meses-lista");
    this.$btnAgregarMes = document.getElementById("btn-agregar-mes");
    this.$btnRepetirMes = document.getElementById("btn-repetir-mes");
    this.$btnGuardarPeriodo = document.getElementById("btn-guardar-periodo");
    this.$btnVerResultados = document.getElementById("btn-ver-resultados");
    this.$btnVolverHome = document.getElementById("btn-volver-home");
    this.$metrics = document.getElementById("metrics");
    this.$btnVolverDetalle = document.getElementById("btn-volver-detalle");
    this.$btnVolverHome2 = document.getElementById("btn-volver-home2");
    this.$menuGestionPeriodos = document.getElementById("menu-gestion-periodos");

    // Modal de confirmación de eliminación
    this.$deleteConfirmationModal = document.getElementById("delete-confirmation-modal");
    this.$confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    this.$cancelDeleteBtn = document.getElementById("cancel-delete-btn");

    // Modal de creación de periodo
    this.$createPeriodModal = document.getElementById("create-period-modal");
    this.$createPeriodForm = document.getElementById("create-period-form");
    this.$cancelCreatePeriodBtn = document.getElementById("cancel-create-period-btn");
    this.$createPeriodError = document.getElementById("create-period-error");
  }

  bindEvents() {
    this.$btnNuevoPeriodo.addEventListener("click", () => this.showCreatePeriodModal());
    this.$btnAgregarMes.addEventListener("click", () => this.handleAgregarMes());
    this.$btnRepetirMes.addEventListener("click", () => this.handleRepetirMes());
    /* MODIFICADO: Se actualizó el evento para guardar cambios, delegándolo a periodDetailUI.guardarCambiosTabla() */
    this.$btnGuardarPeriodo.addEventListener("click", () => {
      if (this.periodoSeleccionado) {
        this.periodDetailUI.guardarCambiosTabla();
      }
    });
    this.$btnVerResultados.addEventListener("click", () => this.mostrarResultados());
    this.$btnVolverHome.addEventListener("click", () => this.mostrarHome());
    this.$btnVolverDetalle.addEventListener("click", () => this.mostrarDetalle());
    this.$btnVolverHome2.addEventListener("click", () => this.mostrarHome());
    this.$menuGestionPeriodos.addEventListener("click", (e) => {
      e.preventDefault();
      this.mostrarHome();
    });

    // Modal de creación de periodo
    this.$createPeriodForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleCreatePeriodSubmit();
    });
    this.$cancelCreatePeriodBtn.addEventListener("click", () => this.hideCreatePeriodModal());

    // Detectar Enter global para guardar la tabla si está en modo edición
    document.addEventListener("keydown", (e) => {
      if (this.periodDetailUI.isEditingTable && e.key === "Enter") {
        e.preventDefault();
        this.periodDetailUI.guardarCambiosTabla();
      }
    });
  }

  // Delegación de modal de eliminación
  showDeleteConfirmation(id) {
    this.modalManager.showDeleteConfirmation(id);
  }

  handleEliminarPeriodo(id) {
    this.periodoService.eliminarPeriodo(id);
    if (this.periodoSeleccionado && this.periodoSeleccionado.id === id) {
      this.periodoSeleccionado = null;
    }
    this.periodListUI.renderPeriodos();
  }

  // Creación de periodos
  showCreatePeriodModal() {
    this.$createPeriodError.style.display = "none";
    this.$createPeriodForm.reset();
    this.$createPeriodModal.classList.remove("hidden");
    this.$createPeriodModal.setAttribute("aria-hidden", "false");
  }

  hideCreatePeriodModal() {
    this.$createPeriodModal.classList.add("hidden");
    this.$createPeriodModal.setAttribute("aria-hidden", "true");
  }

  showCreatePeriodError(message) {
    this.$createPeriodError.textContent = message;
    this.$createPeriodError.style.display = "block";
  }

  handleCreatePeriodSubmit() {
    const startValue = this.$createPeriodForm.periodStart.value;
    const endValue = this.$createPeriodForm.periodEnd.value;
    const periodName = this.$createPeriodForm.periodName.value.trim();
    const periodDescription = this.$createPeriodForm.periodDescription.value.trim();

    if (!startValue || !endValue || !periodName || !periodDescription) {
      this.showCreatePeriodError("Todos los campos son obligatorios.");
      return;
    }

    const [startYear, startMonth] = startValue.split("-").map(Number);
    const [endYear, endMonth] = endValue.split("-").map(Number);
    const startDate = new Date(startYear, startMonth - 1, 1);
    const endDate = new Date(endYear, endMonth - 1, 1);

    if (endDate <= startDate) {
      this.showCreatePeriodError("La fecha de fin debe ser posterior a la fecha de inicio.");
      return;
    }

    const diffMonths = this.calculateMonthDifference(startDate, endDate);
    if (diffMonths < 1) {
      this.showCreatePeriodError("El periodo debe abarcar al menos 1 mes.");
      return;
    }

    const meses = this.generarMeses(startDate, endDate);
    const nuevoPeriodo = this.periodoService.crearPeriodo(
      periodName,
      periodDescription,
      startValue,
      endValue,
      meses
    );
    this.periodoSeleccionado = nuevoPeriodo;
    this.hideCreatePeriodModal();
    this.mostrarDetalle();
  }

  calculateMonthDifference(startDate, endDate) {
    const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthsDiff = endDate.getMonth() - startDate.getMonth();
    return yearsDiff * 12 + monthsDiff;
  }

  generarMeses(startDate, endDate) {
    const meses = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const month = (current.getMonth() + 1).toString().padStart(2, "0");
      const year = current.getFullYear().toString().slice(-2);
      meses.push({
        mes: `${month}/${year}`,
        inflacion: 0,
        tipoCambio: 0,
        ingresoLocal: 0,
        ingresoExtranjera: 0,
        variacionTC: 0,
      });
      current.setMonth(current.getMonth() + 1);
    }
    return meses;
  }

  // Navegación
  mostrarHome() {
    this.$viewHome.classList.remove("hidden");
    this.$viewDetalle.classList.add("hidden");
    this.$viewResultados.classList.add("hidden");
    this.periodListUI.renderPeriodos();
  }

  mostrarDetalle() {
    this.periodDetailUI.mostrarDetalle();
  }

  mostrarResultados() {
    if (!this.periodoSeleccionado) return;
    this.$viewHome.classList.add("hidden");
    this.$viewDetalle.classList.add("hidden");
    this.$viewResultados.classList.remove("hidden");
    this.calcularYMostrarMetricas();
  }

  // Operaciones sobre periodos
  handleSeleccionarPeriodo(id) {
    this.periodoSeleccionado = this.periodoService.obtenerPeriodoPorId(id);
    if (!this.periodoSeleccionado) return;
    this.mostrarDetalle();
  }

  handleDuplicationPeriodo(id) {
    this.periodoService.duplicarPeriodo(id);
    this.periodoSeleccionado = this.periodoService.obtenerPeriodoPorId(id);
    this.mostrarDetalle();
  }

  handleVerResultados(id) {
    this.periodoSeleccionado = this.periodoService.obtenerPeriodoPorId(id);
    if (!this.periodoSeleccionado) return;
    this.mostrarResultados();
  }

  handleAgregarMes() {
    if (!this.periodoSeleccionado) return;
    const nuevoMes = {
      mes: this.getNuevoMesNombre(),
      inflacion: 0,
      tipoCambio: 0,
      ingresoLocal: 0,
      ingresoExtranjera: 0,
      variacionTC: 0,
    };
    this.periodoSeleccionado.meses.push(nuevoMes);
    this.periodoService.actualizarPeriodo(this.periodoSeleccionado);
    this.periodDetailUI.renderMeses(this.periodoSeleccionado);
  }

  handleRepetirMes() {
    if (!this.periodoSeleccionado) return;
    const index = this.periodoSeleccionado.meses.length - 1;
    const ultimoMes = this.periodoSeleccionado.meses[index];
    const nuevoMes = {
      mes: this.getNuevoMesNombre(),
      inflacion: ultimoMes.inflacion,
      tipoCambio: ultimoMes.tipoCambio,
      ingresoLocal: ultimoMes.ingresoLocal,
      ingresoExtranjera: ultimoMes.ingresoExtranjera,
      variacionTC: 0,
    };
    this.periodoSeleccionado.meses.push(nuevoMes);
    this.periodoService.actualizarPeriodo(this.periodoSeleccionado);
    this.periodDetailUI.renderMeses(this.periodoSeleccionado);
  }

  getNuevoMesNombre() {
    const meses = this.periodoSeleccionado.meses;
    if (meses.length === 0) {
      alert("No hay meses en este periodo.");
      return;
    }
    const ultimoMes = meses[meses.length - 1].mes;
    const [mesStr, anioStr] = ultimoMes.split("/");
    let mes = parseInt(mesStr, 10);
    let anio = parseInt("20" + anioStr, 10);
    mes++;
    if (mes > 12) {
      mes = 1;
      anio++;
    }
    return mes.toString().padStart(2, "0") + "/" + anio.toString().slice(-2);
  }

  // Cálculo de métricas
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

// Instancia global
export const uiManager = new UIManager();
window.uiManager = uiManager;
