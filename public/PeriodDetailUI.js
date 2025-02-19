// PeriodDetailUI.js (Actualizado)
export class PeriodDetailUI {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.$viewDetalle = document.getElementById("view-detalle");
    this.$mesesLista = document.getElementById("meses-lista");
    this.$periodoNombre = document.getElementById("periodo-nombre");
    this.$periodoDates = document.getElementById("periodo-hasta");
    this.$metrics = document.getElementById("metrics");
    this.isEditingTable = false;
    this.$editButton = null;
  }

  mostrarDetalle() {
    const periodo = this.uiManager.periodoSeleccionado;
    if (!periodo) return;
    // Oculta las otras vistas
    this.uiManager.$viewHome.classList.add("hidden");
    this.uiManager.$viewResultados.classList.add("hidden");
    this.$viewDetalle.classList.remove("hidden");
    this.$periodoNombre.textContent = "Periodo: " + periodo.nombre;
    this.$periodoDates.textContent = `Desde ${periodo.fechaInicio} hasta ${periodo.fechaFin}`;
    this.renderMeses(periodo);
    this.uiManager.calcularYMostrarMetricas();
  }

  renderMeses(periodo) {
    if (!periodo || periodo.meses.length === 0) {
      this.$mesesLista.innerHTML = "<p>No hay meses en este periodo.</p>";
      return;
    }
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
        <td>${this.renderDeleteButton(index, periodo)}</td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // Crear contenedores de acciones para agrupar los botones
    // Contenedor superior: Acción de edición
    this.$editButton = document.createElement("button");
    this.$editButton.classList.add("btn-primary");
    this.$editButton.textContent = this.isEditingTable ? "Guardar Cambios" : "Editar Tabla";

    // Contenedor inferior: Acciones de autocompletado
    const autoExchangeBtn = document.createElement("button");
    autoExchangeBtn.id = "btn-auto-exchange";
    autoExchangeBtn.classList.add("btn-primary");
    autoExchangeBtn.textContent = "Completar TC Dólar";
    autoExchangeBtn.addEventListener("click", () => {
      if (!this.uiManager.periodoSeleccionado) {
        alert("No hay un periodo seleccionado.");
        return;
      }
      this.uiManager.autoExchangeUI.showModal();
    });
    const inflationBtn = document.createElement("button");
    inflationBtn.id = "btn-auto-inflation";
    inflationBtn.classList.add("btn-primary");
    inflationBtn.textContent = "AutoCompletar inflación BCRA";
    inflationBtn.addEventListener("click", () => {
      if (!this.uiManager.periodoSeleccionado) {
        alert("No hay un periodo seleccionado.");
        return;
      }
      this.uiManager.autoInflationUI.showModal();
    });

    this.handleEditingPeriod();

    // Limpiar el contenedor de meses y agregar los elementos en el nuevo orden
    this.$mesesLista.innerHTML = "";
    const topActionsContainer = document.createElement("div");
    topActionsContainer.className = "meses-actions-top";
    // Este contenedor agrupa la acción primaria de edición
    topActionsContainer.appendChild(this.$editButton);

    const bottomActionsContainer = document.createElement("div");
    bottomActionsContainer.className = "meses-actions-bottom";
    // Este contenedor agrupa las acciones de autocompletado
    bottomActionsContainer.appendChild(autoExchangeBtn);
    bottomActionsContainer.appendChild(inflationBtn);

    // Agregar los contenedores y la tabla al listado de meses
    this.$mesesLista.appendChild(topActionsContainer);
    this.$mesesLista.appendChild(table);
    this.$mesesLista.appendChild(bottomActionsContainer);

    // Agregar event listeners a los botones de eliminación en la tabla
    table.querySelectorAll("button[data-action='deleteMonth']").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(btn.getAttribute("data-index"), 10);
        this.deleteMonth(index);
      });
    });
    this.recalcularVariaciones();
  }

  renderDeleteButton(index, periodo) {
    const totalRows = periodo.meses.length;
    if (totalRows === 1) {
      return `<button class="btn-danger" disabled>Eliminar</button>`;
    }
    // Solo se permite eliminar el primer o último mes
    if (index === 0 || index === totalRows - 1) {
      return `<button class="btn-danger" data-action="deleteMonth" data-index="${index}">Eliminar</button>`;
    }
    return "<p>No es posible eliminar</p>";
  }

  deleteMonth(index) {
    const periodo = this.uiManager.periodoSeleccionado;
    if (!periodo) return;
    // Eliminar el mes del arreglo
    periodo.meses.splice(index, 1);
    // Actualizar el servicio y re-renderizar
    this.uiManager.periodoService.actualizarPeriodo(periodo);
    this.renderMeses(periodo);
    this.uiManager.calcularYMostrarMetricas();
  }

  handleEditingPeriod() {
    this.$editButton.textContent = this.isEditingTable ? "Guardar Cambios" : "Editar Tabla";
    this.$editButton.onclick = () => {
      if (!this.isEditingTable) {
        this.toggleTableEditMode(true);
      } else {
        this.guardarCambiosTabla();
      }
    };
  }

  toggleTableEditMode(activate) {
    this.isEditingTable = activate;
    this.renderMeses(this.uiManager.periodoSeleccionado);
    const table = document.querySelector(".table-meses");
    if (this.isEditingTable && table) {
      const editableCells = table.querySelectorAll("td.editable");
      editableCells.forEach(cell => {
        cell.contentEditable = "true";
        cell.classList.add("editing-cell");
      });
    } else if (table) {
      const editableCells = table.querySelectorAll("td.editable");
      editableCells.forEach(cell => {
        cell.contentEditable = "false";
        cell.classList.remove("editing-cell");
      });
    }
  }

  EditRow(row) {
    this.isEditingTable = true;
    const editableCells = row.querySelectorAll("td.editable");
    editableCells.forEach(cell => {
      cell.contentEditable = "true";
      cell.classList.add("editing-cell");
    });
  }

  guardarCambiosTabla() {
    const periodo = this.uiManager.periodoSeleccionado;
    if (!periodo) return;
    const table = document.querySelector(".table-meses");
    const editableCells = table.querySelectorAll("td.editable");
    editableCells.forEach((cell) => {
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
    this.uiManager.periodoService.actualizarPeriodo(periodo);
    this.recalcularVariaciones();
    this.uiManager.calcularYMostrarMetricas();
    this.toggleTableEditMode(false);
    alert("Tabla guardada con éxito.");
  }

  recalcularVariaciones() {
    const periodo = this.uiManager.periodoSeleccionado;
    if (!periodo || periodo.meses.length < 2) return;
    periodo.meses.forEach((mes, index, arr) => {
      if (index === 0) {
        mes.variacionTC = 0;
      } else {
        const prev = arr[index - 1].tipoCambio;
        const curr = mes.tipoCambio;
        mes.variacionTC = prev ? ((curr - prev) / prev) * 100 : 0;
      }
    });
    this.uiManager.periodoService.actualizarPeriodo(periodo);
  }
}
