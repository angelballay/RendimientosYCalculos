// MonthManager.js
// Esta clase se encarga de la creación, renderizado y gestión de los meses dentro de un periodo.
// Se crean los botones de acción (agregar mes al final, duplicar mes anterior y agregar mes al inicio)
// y se gestiona el renderizado de la tabla de meses, así como sus acciones (editar, eliminar, etc.).

class MonthManager {
    constructor(uiManager) {
      this.uiManager = uiManager;
      // Contenedor donde se mostrarán los meses y las acciones; se asume que en index.html solo existe el contenedor "meses-lista"
      this.monthsContainer = document.getElementById("meses-lista");
      // Crear los contenedores de acciones y tabla de forma dinámica
      this.createActionButtons();
    }
  
    createActionButtons() {
      // Contenedor superior para la acción de edición
      this.topActionsContainer = document.createElement("div");
      this.topActionsContainer.className = "meses-actions-top";
  
      // Contenedor inferior para las acciones de agregar/duplicar meses
      this.bottomActionsContainer = document.createElement("div");
      this.bottomActionsContainer.className = "meses-actions-bottom";
  
      // Botón para activar/desactivar el modo de edición
      this.btnEdit = document.createElement("button");
      this.btnEdit.classList.add("btn-primary");
      this.btnEdit.textContent = "Editar Tabla";
  
      // Botón para agregar mes al final
      this.btnAgregarMes = document.createElement("button");
      this.btnAgregarMes.classList.add("btn-primary");
      this.btnAgregarMes.textContent = "Agregar Mes";
  
      // Botón para duplicar el último mes
      this.btnRepetirMes = document.createElement("button");
      this.btnRepetirMes.classList.add("btn-secondary");
      this.btnRepetirMes.textContent = "Repetir del Mes Anterior";
  
      // Botón para agregar mes al inicio
      this.btnAgregarMesInicio = document.createElement("button");
      this.btnAgregarMesInicio.classList.add("btn-primary");
      this.btnAgregarMesInicio.textContent = "Agregar Mes al Inicio";
  
      // Botón para guardar cambios (solo visible en modo edición)
      this.btnGuardarPeriodo = document.createElement("button");
      this.btnGuardarPeriodo.classList.add("btn-success");
      this.btnGuardarPeriodo.textContent = "Guardar Cambios";
  
      // Agregar botones a sus contenedores
      this.topActionsContainer.appendChild(this.btnEdit);
      this.bottomActionsContainer.appendChild(this.btnAgregarMes);
      this.bottomActionsContainer.appendChild(this.btnRepetirMes);
      this.bottomActionsContainer.appendChild(this.btnAgregarMesInicio);
      this.bottomActionsContainer.appendChild(this.btnGuardarPeriodo);
  
      // Crear un contenedor para la tabla de meses
      this.tableContainer = document.createElement("div");
  
      // Limpiar y reconstruir el contenedor principal de meses
      this.monthsContainer.innerHTML = "";
      this.monthsContainer.appendChild(this.topActionsContainer);
      this.monthsContainer.appendChild(this.tableContainer);
      this.monthsContainer.appendChild(this.bottomActionsContainer);
  
      // Adjuntar eventos a los botones
      this.attachButtonEvents();
    }
  
    attachButtonEvents() {
      // Alternar modo edición con el botón "Editar Tabla"
      this.btnEdit.addEventListener("click", () => {
        if (!this.uiManager.periodoSeleccionado) return;
        if (!this.uiManager.periodDetailUI.isEditingTable) {
          this.toggleEditMode(true);
        } else {
          this.guardarCambiosTabla();
        }
      });
      // Agregar mes al final
      this.btnAgregarMes.addEventListener("click", () => {
        if (!this.uiManager.periodoSeleccionado) return;
        this.addMonthAtEnd();
      });
      // Duplicar el último mes
      this.btnRepetirMes.addEventListener("click", () => {
        if (!this.uiManager.periodoSeleccionado) return;
        this.duplicateLastMonth();
      });
      // Agregar mes al inicio
      this.btnAgregarMesInicio.addEventListener("click", () => {
        if (!this.uiManager.periodoSeleccionado) return;
        this.addMonthAtBeginning();
      });
      // Guardar cambios en modo edición
      this.btnGuardarPeriodo.addEventListener("click", () => {
        if (!this.uiManager.periodoSeleccionado) return;
        this.guardarCambiosTabla();
      });
    }
  
    renderTable(periodo) {
      // Construir la tabla de meses
      const table = document.createElement("table");
      table.className = "table-meses";
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
      const tbody = document.createElement("tbody");
      periodo.meses.forEach((mes, index) => {
        const row = document.createElement("tr");
        row.addEventListener("dblclick", (event) => {
          event.preventDefault();
          this.enableRowEditing(row);
          this.toggleEditMode(true);
        });
        row.innerHTML = `
          <td data-field="mes">${mes.mes}</td>
          <td class="editable" data-field="inflacion">${mes.inflacion}</td>
          <td class="editable" data-field="tipoCambio">${mes.tipoCambio}</td>
          <td class="editable" data-field="ingresoLocal">${mes.ingresoLocal}</td>
          <td class="editable" data-field="ingresoExtranjera">${mes.ingresoExtranjera}</td>
          <td>${mes.variacionTC ? mes.variacionTC.toFixed(2) : "N/A"}%</td>
          <td>${this.renderDeleteButton(index, periodo)}</td>
        `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      this.tableContainer.innerHTML = "";
      this.tableContainer.appendChild(table);
      // Se pueden agregar eventos específicos para los botones de eliminación si se insertan en el HTML generado
      const deleteButtons = table.querySelectorAll("button[data-action='deleteMonth']");
      deleteButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const index = parseInt(btn.getAttribute("data-index"), 10);
          this.deleteMonth(index);
        });
      });
    }
  
    renderDeleteButton(index, periodo) {
      const totalRows = periodo.meses.length;
      if (totalRows === 1) {
        return `<button class="btn-danger" disabled>Eliminar</button>`;
      }
      // Permitir eliminar solo el primer y el último mes
      if (index === 0 || index === totalRows - 1) {
        return `<button class="btn-danger" data-action="deleteMonth" data-index="${index}">Eliminar</button>`;
      }
      return "<p>No es posible eliminar</p>";
    }
  
    // Métodos de modo edición
    toggleEditMode(activate) {
      this.uiManager.periodDetailUI.isEditingTable = activate;
      this.btnEdit.textContent = activate ? "Guardar Cambios" : "Editar Tabla";
      const table = this.tableContainer.querySelector("table");
      if (!table) return;
      const editableCells = table.querySelectorAll("td.editable");
      editableCells.forEach(cell => {
        cell.contentEditable = activate ? "true" : "false";
        if (activate) {
          cell.classList.add("editing-cell");
        } else {
          cell.classList.remove("editing-cell");
        }
      });
    }
  
    enableRowEditing(row) {
      const editableCells = row.querySelectorAll("td.editable");
      editableCells.forEach(cell => {
        cell.contentEditable = "true";
        cell.classList.add("editing-cell");
      });
    }
  
    guardarCambiosTabla() {
      const periodo = this.uiManager.periodoSeleccionado;
      if (!periodo) return;
      const table = this.tableContainer.querySelector("table");
      if (!table) return;
      const editableCells = table.querySelectorAll("td.editable");
      editableCells.forEach(cell => {
        const field = cell.getAttribute("data-field");
        let newValue = cell.textContent.trim();
        if (field !== "mes") {
          const parsed = parseFloat(newValue);
          newValue = isNaN(parsed) ? 0 : parsed;
        }
        const row = cell.parentElement;
        const rowIndex = Array.from(row.parentElement.children).indexOf(row);
        periodo.meses[rowIndex][field] = newValue;
      });
      // Llamar a la función de recalcular variaciones que ya existe en PeriodDetailUI
      this.uiManager.periodDetailUI.recalcularVariaciones();
      this.uiManager.periodoService.actualizarPeriodo(periodo);
      this.renderTable(periodo);
      this.toggleEditMode(false);
      alert("Tabla guardada con éxito.");
    }
  
    // Métodos de gestión de meses
    addMonthAtEnd() {
      const periodo = this.uiManager.periodoSeleccionado;
      if (!periodo) return;
      const nuevoMes = {
        mes: this.getNuevoMesNombre(),
        inflacion: 0,
        tipoCambio: 0,
        ingresoLocal: 0,
        ingresoExtranjera: 0,
        variacionTC: 0,
      };
      periodo.meses.push(nuevoMes);
      this.uiManager.periodoService.actualizarPeriodo(periodo);
      this.renderTable(periodo);
    }
  
    duplicateLastMonth() {
      const periodo = this.uiManager.periodoSeleccionado;
      if (!periodo || periodo.meses.length === 0) return;
      const ultimoMes = periodo.meses[periodo.meses.length - 1];
      const nuevoMes = {
        mes: this.getNuevoMesNombre(),
        inflacion: ultimoMes.inflacion,
        tipoCambio: ultimoMes.tipoCambio,
        ingresoLocal: ultimoMes.ingresoLocal,
        ingresoExtranjera: ultimoMes.ingresoExtranjera,
        variacionTC: 0,
      };
      periodo.meses.push(nuevoMes);
      this.uiManager.periodoService.actualizarPeriodo(periodo);
      this.renderTable(periodo);
    }
  
    addMonthAtBeginning() {
      const periodo = this.uiManager.periodoSeleccionado;
      if (!periodo) return;
      const nuevoMes = {
        mes: this.getNuevoMesAlInicio(),
        inflacion: 0,
        tipoCambio: 0,
        ingresoLocal: 0,
        ingresoExtranjera: 0,
        variacionTC: 0,
      };
      periodo.meses.unshift(nuevoMes);
      this.uiManager.periodoService.actualizarPeriodo(periodo);
      this.renderTable(periodo);
    }
  
    getNuevoMesNombre() {
      const periodo = this.uiManager.periodoSeleccionado;
      const meses = periodo.meses;
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
  
    getNuevoMesAlInicio() {
      const periodo = this.uiManager.periodoSeleccionado;
      const meses = periodo.meses;
      if (meses.length === 0) {
        alert("No hay meses en este periodo.");
        return;
      }
      const primerMes = meses[0].mes;
      const [mesStr, anioStr] = primerMes.split("/");
      let mes = parseInt(mesStr, 10);
      let anio = parseInt("20" + anioStr, 10);
      mes--;
      if (mes < 1) {
        mes = 12;
        anio--;
      }
      return mes.toString().padStart(2, "0") + "/" + anio.toString().slice(-2);
    }
  
    deleteMonth(index) {
      const periodo = this.uiManager.periodoSeleccionado;
      if (!periodo) return;
      periodo.meses.splice(index, 1);
      this.uiManager.periodoService.actualizarPeriodo(periodo);
      this.renderTable(periodo);
      this.uiManager.calcularYMostrarMetricas();
    }
  }
  
  export default MonthManager;
  