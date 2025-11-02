// PeriodDetailUI.js (Actualizado)
import MonthManager from "./MonthManager.js";

export class PeriodDetailUI {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.$viewDetalle = document.getElementById("view-detalle");
    this.$periodoNombre = document.getElementById("periodo-nombre");
    this.$periodoDates = document.getElementById("periodo-hasta");
    this.$metrics = document.getElementById("metrics");
    this.isEditingTable = false;
    // Instanciar el gestor de meses
    this.monthManager = new MonthManager(uiManager);
  }

  mostrarDetalle() {
    const periodo = this.uiManager.periodoSeleccionado;
    if (!periodo) return;
    // Ocultar otras vistas
    this.uiManager.$viewHome.classList.add("hidden");
    this.uiManager.$viewResultados.classList.add("hidden");
    this.$viewDetalle.classList.remove("hidden");
    this.$periodoNombre.textContent = "Periodo: " + periodo.nombre;
    this.$periodoDates.textContent = `Desde ${periodo.fechaInicio} hasta ${periodo.fechaFin}`;
    // Delegar el renderizado de meses a MonthManager
    this.monthManager.renderTable(periodo);
    this.uiManager.calcularYMostrarMetricas();
  }

  // Se mantiene la función recalcularVariaciones (si es que no se mueve a otro módulo)
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
