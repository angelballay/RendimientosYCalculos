/**
 * uiManager.js
 * 
 * UIManager
 * Maneja la interacción con el DOM y la comunicación entre la UI y los servicios.
 */
import { PeriodoService } from "./periodoService.js"
import { MetricsCalculator } from './metricsCalculator.js';

export class UIManager {
  constructor() {
    this.periodoService = new PeriodoService();
    this.metricsCalculator = new MetricsCalculator();
    this.periodoSeleccionado = null;
    this.periodoAEliminar = null; // para almacenar el ID del periodo que se va a eliminar
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

    // Modal de confirmación
    this.$deleteConfirmationModal = document.getElementById('delete-confirmation-modal');
    this.$confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    this.$cancelDeleteBtn = document.getElementById('cancel-delete-btn');
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

    // Eventos del modal de eliminación
    this.$confirmDeleteBtn.addEventListener('click', () => {
      if (this.periodoAEliminar) {
        this.handleEliminarPeriodo(this.periodoAEliminar);
      }
      this.hideDeleteConfirmation();
    });
    this.$cancelDeleteBtn.addEventListener('click', () => this.hideDeleteConfirmation());
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

  // NUEVO: Genera una tabla en lugar de cards
  renderPeriodos() {
    const periodos = this.periodoService.obtenerPeriodos();
    if (periodos.length === 0) {
      this.$periodosLista.innerHTML = '<p>No hay periodos creados.</p>';
      return;
    }

    // Construimos la tabla
    let tableHtml = `
      <table class="table-periodos">
        <thead>
          <tr>
            <th>Nombre del periodo</th>
            <th>Fecha inicio</th>
            <th>Fecha fin</th>
            <th>% de rendimiento real</th>
            <th>Rendimiento real (divisa local)</th>
            <th>Detalles</th>
            <th>Eliminar</th>
          </tr>
        </thead>
        <tbody>
    `;

    periodos.forEach((periodo) => {
      // Obtenemos fechaInicio y fechaFin a partir de los meses
      const fechaInicio = periodo.meses[0]?.mes || 'N/A';
      const fechaFin = periodo.meses[periodo.meses.length - 1]?.mes || 'N/A';
      // % de rendimiento real y ganancia real (divisa local)
      const porcentaje = (periodo.porcentajeGananciaReal !== undefined)
        ? periodo.porcentajeGananciaReal.toFixed(2) + '%'
        : 'N/A';
      const ganancia = (periodo.gananciaReal !== undefined)
        ? periodo.gananciaReal.toFixed(2)
        : 'N/A';

      tableHtml += `
        <tr>
          <td>${periodo.nombre}</td>
          <td>${fechaInicio}</td>
          <td>${fechaFin}</td>
          <td>${porcentaje}</td>
          <td>${ganancia}</td>
          <td>
            <button class="btn-primary" onclick="uiManager.handleSeleccionarPeriodo('${periodo.id}')">
              Detalles
            </button>
          </td>
          <td>
            <button class="btn-danger" onclick="uiManager.showDeleteConfirmation('${periodo.id}')">
              Eliminar
            </button>
          </td>
        </tr>
      `;
    });

    tableHtml += `
        </tbody>
      </table>
    `;

    this.$periodosLista.innerHTML = tableHtml;
  }

  showDeleteConfirmation(periodoId) {
    this.periodoAEliminar = periodoId;
    this.$deleteConfirmationModal.classList.remove('hidden');
    this.$deleteConfirmationModal.setAttribute('aria-hidden', 'false');
  }

  hideDeleteConfirmation() {
    this.periodoAEliminar = null;
    this.$deleteConfirmationModal.classList.add('hidden');
    this.$deleteConfirmationModal.setAttribute('aria-hidden', 'true');
  }

  createPeriodoCard() {
    // Eliminado o deprecado. Ya no se utiliza la vista en formato "card".
  }

  handleNuevoPeriodo() {
    const nombre = prompt("Ingrese el nombre del nuevo periodo (ej. '2024 - Q1')");
    if (!nombre) return;
    this.periodoService.crearPeriodo(nombre);
    this.renderPeriodos();
  }

  handleEliminarPeriodo(id) {
    // Muestra pop-up en la vista. Al confirmar, se elimina.
    this.periodoService.eliminarPeriodo(id);
    if (this.periodoSeleccionado && this.periodoSeleccionado.id === id) {
      this.periodoSeleccionado = null;
    }
    this.renderPeriodos();
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

  handleGuardarPeriodo() {
    if (!this.periodoSeleccionado) return;
    this.periodoService.actualizarPeriodo(this.periodoSeleccionado);
    alert("Periodo guardado con éxito.");
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
