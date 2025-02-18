// PeriodListUI.js
export class PeriodListUI {
    /**
     * @param {UIManager} uiManager - Referencia al UIManager principal para acceder a servicios y estados.
     */
    constructor(uiManager) {
      this.uiManager = uiManager;
      this.$periodosLista = document.getElementById("periodos-lista");
    }
  
    /**
     * Renderiza la lista de periodos en forma de tabla.
     */
    renderPeriodos() {
      const periodos = this.uiManager.periodoService.obtenerPeriodos();
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
              <button class="btn-primary" data-action="select" data-id="${periodo.id}">
                Detalles
              </button>
            </td>
            <td>
              <button class="btn-danger" data-action="delete" data-id="${periodo.id}">
                Eliminar
              </button>
            </td>
            <td>
              <button class="btn-primary" data-action="duplicate" data-id="${periodo.id}">
                Duplicar
              </button>
            </td>
          </tr>`;
      });
  
      tableHtml += `</tbody></table>`;
      this.$periodosLista.innerHTML = tableHtml;
  
      // Agregamos event listeners a los botones
      this.$periodosLista.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const action = e.target.dataset.action;
          const id = e.target.dataset.id;
          this.handleTableAction(action, id);
        });
      });
    }
  
    handleTableAction(action, id) {
      switch(action) {
        case "select":
          this.uiManager.handleSeleccionarPeriodo(id);
          break;
        case "delete":
          this.uiManager.showDeleteConfirmation(id);
          break;
        case "duplicate":
          this.uiManager.handleDuplicationPeriodo(id);
          break;
        default:
          console.warn("Acción no reconocida:", action);
      }
    }
  }
  