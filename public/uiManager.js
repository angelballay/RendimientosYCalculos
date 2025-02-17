/**
 * uiManager.js
 * 
 * UIManager
 * Maneja la interacción con el DOM y la comunicación entre la UI y los servicios.
 */
import { PeriodoService } from "./periodoService.js";
import { MetricsCalculator } from "./metricsCalculator.js";
import { ExchangeAutoFillUI } from "./js/exchangeAutoFillUI.js";

export class UIManager {
  constructor() {
    this.periodoService = new PeriodoService();
    this.metricsCalculator = new MetricsCalculator();
    this.periodoSeleccionado = null;
    this.periodoAEliminar = null; // Para almacenar el ID del periodo a eliminar
    this.isEditingTable = false;  // Controla si la tabla entera está en modo edición
    this.cacheSelectors();
    this.bindEvents();

    // Instancia la nueva UI para autocompletar TC
    this.autoExchangeUI = new ExchangeAutoFillUI(this);
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
    this.$editButton;

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
    this.$btnGuardarPeriodo.addEventListener("click", () => this.handleGuardarPeriodo());
    this.$btnVerResultados.addEventListener("click", () => this.mostrarResultados());
    this.$btnVolverHome.addEventListener("click", () => this.mostrarHome());
    this.$btnVolverDetalle.addEventListener("click", () => this.mostrarDetalle());
    this.$btnVolverHome2.addEventListener("click", () => this.mostrarHome());
    this.$menuGestionPeriodos.addEventListener("click", (e) => {
      e.preventDefault();
      this.mostrarHome();
    });

    // Modal de eliminación
    this.$confirmDeleteBtn.addEventListener("click", () => {
      if (this.periodoAEliminar) {
        this.handleEliminarPeriodo(this.periodoAEliminar);
      }
      this.hideDeleteConfirmation();
    });
    this.$cancelDeleteBtn.addEventListener("click", () => this.hideDeleteConfirmation());

    // Modal de creación de periodo
    this.$createPeriodForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleCreatePeriodSubmit();
    });
    this.$cancelCreatePeriodBtn.addEventListener("click", () => this.hideCreatePeriodModal());

    // Detectar Enter global para guardar la tabla si está en modo edición
    document.addEventListener("keydown", (e) => {
      if (this.isEditingTable && e.key === "Enter") {
        e.preventDefault();
        this.guardarCambiosTabla();
      }
    });
  }

  handleEditingPeriod(){
    this.$editButton.textContent = this.isEditingTable ? "Guardar Cambios" : "Editar Tabla";
    this.$editButton.onclick = () => {
      if (!this.isEditingTable) {
        // Activar modo edición
        this.toggleTableEditMode(true);
      } else {
        // Guardar cambios
        this.guardarCambiosTabla();
      }
    };
  }
  

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
    this.renderMeses();
  }
  iteracion = 0;
  handleRepetirMes() {
    if(this.periodoSeleccionado){
      this.iteracion++;
      console.log({periodo:this.periodoSeleccionado,mes:this.periodoSeleccionado.meses,iteration:this.iteracion})
      if(this.periodoSeleccionado.meses){
        let index = this.periodoSeleccionado.meses.length - 1
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
        this.renderMeses();
      }
    }
    
  }

  renderPeriodos() {
    const periodos = this.periodoService.obtenerPeriodos();
    if (periodos.length === 0) {
      this.$periodosLista.innerHTML = "<p>No hay periodos creados.</p>";
      return;
    }
    let tableHtml = 
      `<table class="table-periodos">
        <thead>
          <tr>
            <th>Nombre del periodo</th>
            <th>Fecha inicio</th>
            <th>Fecha fin</th>
            <th>% de rendimiento real</th>
            <th>Rendimiento real (divisa local)</th>
            <th>Detalles</th>
            <th>Eliminar</th>
            <th>Duplicar</th>
          </tr>
        </thead>
        <tbody>`;
    periodos.forEach((periodo) => {
      const fechaInicio = periodo.meses[0]?.mes || "N/A";
      const fechaFin = periodo.meses[periodo.meses.length - 1]?.mes || "N/A";
      const porcentaje = (periodo.porcentajeGananciaReal !== undefined)
        ? periodo.porcentajeGananciaReal.toFixed(2) + "%"
        : "N/A";
      const ganancia = (periodo.gananciaReal !== undefined)
        ? periodo.gananciaReal.toFixed(2)
        : "N/A";
      tableHtml += 
        `<tr>
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
          <td>
            <button class="btn-primary" onclick="uiManager.handleDuplicationPeriodo('${periodo.id}')">
              Duplicar
            </button>
          </td>
        </tr>`;
    });
    tableHtml += 
        `</tbody>
      </table>`;
    this.$periodosLista.innerHTML = tableHtml;
  }

  showDeleteConfirmation(periodoId) {
    this.periodoAEliminar = periodoId;
    this.$deleteConfirmationModal.classList.remove("hidden");
    this.$deleteConfirmationModal.setAttribute("aria-hidden", "false");
  }

  hideDeleteConfirmation() {
    this.periodoAEliminar = null;
    this.$deleteConfirmationModal.classList.add("hidden");
    this.$deleteConfirmationModal.setAttribute("aria-hidden", "true");
  }

  handleEliminarPeriodo(id) {
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

  mostrarHome() {
    this.$viewHome.classList.remove("hidden");
    this.$viewDetalle.classList.add("hidden");
    this.$viewResultados.classList.add("hidden");
    this.renderPeriodos();
  }

  mostrarDetalle() {
    if (!this.periodoSeleccionado) return;
    this.$viewHome.classList.add("hidden");
    this.$viewDetalle.classList.remove("hidden");
    this.$viewResultados.classList.add("hidden");
    this.$periodoNombre.textContent = "Periodo: " + this.periodoSeleccionado.nombre;
    this.$periodoDates.textContent = `Desde ${this.periodoSeleccionado.fechaInicio} hasta ${this.periodoSeleccionado.fechaFin}`;
    this.renderMeses();
    this.calcularYMostrarMetricas();
  }

  mostrarResultados() {
    if (!this.periodoSeleccionado) return;
    this.$viewHome.classList.add("hidden");
    this.$viewDetalle.classList.add("hidden");
    this.$viewResultados.classList.remove("hidden");
    this.calcularYMostrarMetricas();
  }

  /**
   * Renderiza la tabla de meses. Se agrega un botón "Editar Tabla" o "Guardar Cambios"
   * según el estado actual de edición (isEditingTable).
   */
  renderMeses() {
    if (!this.periodoSeleccionado) return;
    if (this.periodoSeleccionado.meses.length === 0) {
      this.$mesesLista.innerHTML = "<p>No hay meses en este periodo.</p>";
      return;
    }
    // Crear tabla
    const table = document.createElement("table");
    table.className = "table-meses";
    if (this.isEditingTable) {
      table.classList.add("table-editing");
    }

    // Encabezado
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Mes</th>
        <th>Inflación (%)</th>
        <th>Tipo de Cambio</th>
        <th>Ingreso Local</th>
        <th>Ingreso Extranjera</th>
        <th>Variación TC</th>
        <th>Eliminar</th>
      </tr>
    `;
    table.appendChild(thead);

    // Cuerpo
    const tbody = document.createElement("tbody");
    this.periodoSeleccionado.meses.forEach((mes, index) => {
      const row = document.createElement("tr");
      row.addEventListener("dblclick", (event) => {
        event.preventDefault();
        this.EditRow(row);
        this.handleEditingPeriod();
      });
      row.innerHTML = `
        <td data-field="mes">${mes.mes}</td>
        <td class="editable" data-field="inflacion">${mes.inflacion}</td>
        <td class="editable" data-field="tipoCambio">${mes.tipoCambio}</td>
        <td class="editable" data-field="ingresoLocal">${mes.ingresoLocal}</td>
        <td class="editable" data-field="ingresoExtranjera">${mes.ingresoExtranjera}</td>
        <td>${mes.variacionTC ? mes.variacionTC.toFixed(2) : "N/A"}%</td>
        <td>
          ${
            this.renderDeleteButton(index)

            
          }
        </td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // Botón para alternar edición de la tabla
    this.$editButton = document.createElement("button");
    this.$editButton.classList.add("btn-primary");

    // Botón para completar TC
    const autoExchangeBtn = document.createElement("button");
    autoExchangeBtn.id = "btn-auto-exchange";
    autoExchangeBtn.classList.add("btn-primary");
    autoExchangeBtn.textContent = "Completar TC Dólar";
    autoExchangeBtn.addEventListener("click", () => {
      if (!this.periodoSeleccionado) {
        alert("No hay un periodo seleccionado.");
        return;
      }
      this.autoExchangeUI.showModal();
    });

    
    this.handleEditingPeriod();
    this.$mesesLista.innerHTML = "";
    this.$mesesLista.appendChild(table);
    this.$mesesLista.appendChild(this.$editButton);
    this.$mesesLista.appendChild(autoExchangeBtn);

    this.recalcularVariaciones();
  }

  
  /**
   * Retorna el HTML del botón "Eliminar" solo si la fila es la primera o la última.
   */
  renderDeleteButton(index) {
    const totalRows = this.periodoSeleccionado.meses.length;
    if (totalRows === 1) {
      // Si solo hay una fila, no se puede eliminar
      return `<button class="btn-danger" disabled>Eliminar</button>`;
    }
    // Solo permitimos eliminar si es la primera fila (index=0) o la última (index=totalRows-1)
    if (index === 0 || index === totalRows - 1) {
      return `<button class="btn-danger" onclick="uiManager.eliminarMes(${index})">Eliminar</button>`;
    }
    // En caso contrario, se deshabilita
    return "<p>No es posible eliminar</p>";
  }

  /**
   * Activa o desactiva el modo edición global de la tabla.
   */
  toggleTableEditMode(activate) {
    this.isEditingTable = activate;
    // Re-render para que aparezca la tabla en modo edición
    this.renderMeses();
    if (this.isEditingTable) {
      // Hacer celdas editables
      const table = document.querySelector(".table-meses");
      const editableCells = table.querySelectorAll("td.editable");
      editableCells.forEach(cell => {
        cell.contentEditable = "true";
        cell.classList.add("editing-cell");
      });
    } else {
      // Desactivar edición
      const table = document.querySelector(".table-meses");
      const editableCells = table.querySelectorAll("td.editable");
      editableCells.forEach(cell => {
        cell.contentEditable = "false";
        cell.classList.remove("editing-cell");
      });
    }
  }

  EditRow(row){
    this.isEditingTable = true;
    const editableCells = row.querySelectorAll("td.editable");
    editableCells.forEach(cell => {
      cell.contentEditable = "true";
      cell.classList.add("editing-cell");
    });
  }

  /**
   * Recorre todas las celdas editables y actualiza el modelo.
   * Luego recalcula métricas, cierra modo edición y muestra pop-up de confirmación.
   */
  guardarCambiosTabla() {
    // Obtener todas las celdas editables
    const table = document.querySelector(".table-meses");
    const editableCells = table.querySelectorAll("td.editable");
    editableCells.forEach((cell, idx) => {
      const field = cell.getAttribute("data-field");
      let newValue = cell.textContent.trim();
      if (field !== "mes") {
        // Convertir a número
        const parsed = parseFloat(newValue);
        newValue = isNaN(parsed) ? 0 : parsed;
      }
      // Localizar el row al que pertenece
      const row = cell.parentElement; 
      const rowIndex = Array.from(row.parentElement.children).indexOf(row);
      this.periodoSeleccionado.meses[rowIndex][field] = newValue;
    });

    // Guardar en servicio
    this.periodoService.actualizarPeriodo(this.periodoSeleccionado);
    // Recalcular
    this.recalcularVariaciones();
    this.calcularYMostrarMetricas();
    // Desactivar modo edición
    this.toggleTableEditMode(false);

    // Pop-up de confirmación
    alert("Tabla guardada con éxito.");
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

  handleGuardarPeriodo() {
    if (!this.periodoSeleccionado) return;
    this.periodoService.actualizarPeriodo(this.periodoSeleccionado);
    alert("Periodo guardado con éxito.");
  }
}

// Instancia global
export const uiManager = new UIManager();
window.uiManager = uiManager;
