// exchangeAutoFillUI.js
import CambioDolarBlue from "./constants.js";

export class ExchangeAutoFillUI {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.cambioDolarBlue = new CambioDolarBlue(); // Instancia para la API
    this.initModal();
    this.bindEvents();
  }

  initModal() {
    const container = document.getElementById("auto-exchange-ui-container");
    container.innerHTML = `
      <div class="modal-overlay hidden" id="auto-exchange-overlay" aria-hidden="true">
        <div class="modal-content" role="dialog" aria-labelledby="autoExchangeModalTitle">
          <h3 id="autoExchangeModalTitle" class="modal-title">Completar Tipo de Cambio</h3>
          <p>Esta opción permite cargar automáticamente el tipo de cambio (Blue u Oficial) desde la API.</p>
          <div>
            <label>
              <input type="radio" name="exchange-type" value="blue" checked />
              Usar Dólar Blue
            </label>
            <label>
              <input type="radio" name="exchange-type" value="oficial" />
              Usar Dólar Oficial
            </label>
          </div>
          <hr />
          <div>
            <label>
              <input type="radio" name="apply-scope" value="all" checked />
              Aplicar a todos los meses
            </label>
            <label>
              <input type="radio" name="apply-scope" value="empty" />
              Aplicar solo a meses sin TC
            </label>
          </div>
          <div class="modal-actions">
            <button id="auto-exchange-confirm" class="btn-success">Confirmar</button>
            <button id="auto-exchange-cancel" class="btn-neutral">Cancelar</button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const overlay = document.getElementById("auto-exchange-overlay");
    const confirmBtn = document.getElementById("auto-exchange-confirm");
    const cancelBtn = document.getElementById("auto-exchange-cancel");

    confirmBtn.addEventListener("click", async () => {
      const selectedExchange = document.querySelector('input[name="exchange-type"]:checked').value;
      const selectedScope = document.querySelector('input[name="apply-scope"]:checked').value;

      // Pequeño feedback (en una app real, se usaría un spinner)
      alert("Obteniendo datos...");

      await this.fillExchangeRates(selectedExchange, selectedScope);

      // Cerrar modal
      overlay.classList.add("hidden");
      overlay.setAttribute("aria-hidden", "true");
    });

    cancelBtn.addEventListener("click", () => {
      overlay.classList.add("hidden");
      overlay.setAttribute("aria-hidden", "true");
    });
  }

  showModal() {
    const overlay = document.getElementById("auto-exchange-overlay");
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
  }

  /**
   * Rellena los meses con el tipo de cambio obtenido de CambioDolarBlue.
   * @param {string} selectedExchange - "blue" u "oficial"
   * @param {string} selectedScope - "all" o "empty"
   */
  async fillExchangeRates(selectedExchange, selectedScope) {
    const periodo = this.uiManager.periodoSeleccionado;
    if (!periodo || !periodo.meses || periodo.meses.length === 0) {
      alert("No hay meses para completar.");
      return;
    }

    const errores = [];

    for (const mes of periodo.meses) {
      if (selectedScope === "empty" && mes.tipoCambio !== 0) {
        // Si el scope es "empty" y ya hay valor en tipoCambio, se salta
        continue;
      }
      const [mm, yy] = mes.mes.split("/");
      const fullYear = "20" + yy;  // asumiendo formato YY
      const dayForAPI = "05";      // Día por defecto
      const fecha = `${fullYear}-${mm}-${dayForAPI}`;

      try {
        const data = await this.cambioDolarBlue.obtenerCambioPorFecha(fecha);
        if (!data || (!data.blue && !data.oficial)) {
          errores.push(mes.mes);
          mes.tipoCambio = 0;
          continue;
        }
        if (selectedExchange === "blue") {
          mes.tipoCambio = data.blue?.value_sell ?? 0;
        } else {
          mes.tipoCambio = data.oficial?.value_sell ?? 0;
        }
      } catch (error) {
        console.error("Error obteniendo TC para ", mes.mes, error);
        errores.push(mes.mes);
        mes.tipoCambio = 0;
      }
    }

    // Guardar en servicio
    this.uiManager.periodoService.actualizarPeriodo(periodo);
    // Re-render
    this.uiManager.renderMeses();
    // Recalcular métricas
    this.uiManager.calcularYMostrarMetricas();

    if (errores.length > 0) {
      alert(`Se completó el TC con errores en los siguientes meses: ${errores.join(", ")}. ` +
            `Se asignó "0" a esos meses.`);
    } else {
      alert("Tipo de cambio completado sin errores.");
    }
  }
}
