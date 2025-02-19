// InflationAutoFillUI.js
import { InflationClient } from "./InflationClient.js";

export default class InflationAutoFillUI {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.inflationClient = new InflationClient();
    this.initModal();
    this.bindEvents();
  }

  initModal() {
    const container = document.getElementById("auto-inflation-ui-container");
    container.innerHTML = `
      <div class="modal-overlay hidden" id="auto-inflation-overlay" aria-hidden="true">
        <div class="modal-content" role="dialog" aria-labelledby="autoInflationModalTitle">
        <div  id="form-inflation-content">
          <h3 id="autoInflationModalTitle" class="modal-title">Actualizar Inflación Mensual</h3>
          <p>Esta opción carga automáticamente la inflación mensual desde la API del BCRA.</p>
          <p id="inflation-dates-info"></p>
          <div>
            <label>
              <input type="radio" name="inflation-scope" value="all" checked />
              Actualizar todas las filas
            </label>
              </label>
          <label>
              <input type="radio" name="inflation-scope" value="empty" />
              Actualizar solo filas sin dato
          </div>
          <div class="modal-actions">
            <button id="auto-inflation-confirm" class="btn-success">Actualizar</button>
            <button id="auto-inflation-cancel" class="btn-neutral">Cerrar</button>
          </div>
          <div id="inflation-message" class="modal-message"></div>
        </div>
          <div id="inflation-spinner" class="spinner hidden"></div>
        </div>
      </div>
    `;
  }

  setLoading(isLoading){
    
    this.showSpinner(isLoading);
    if(isLoading){
        document.getElementById("form-inflation-content").style.display = "none" 
        return;
    }
    document.getElementById("form-inflation-content").style.display = "block" 
  }

  bindEvents() {
    const overlay = document.getElementById("auto-inflation-overlay");
    const confirmBtn = document.getElementById("auto-inflation-confirm");
    const cancelBtn = document.getElementById("auto-inflation-cancel");
    const formContent = document.getElementById("form-inflation-content");

    confirmBtn.addEventListener("click", async () => {
      const selectedScope = document.querySelector('input[name="inflation-scope"]:checked').value;
      const periodo = this.uiManager.periodoSeleccionado;
      if (!periodo || !periodo.meses || periodo.meses.length < 2) {
        this.showMessage("El período debe tener al menos dos meses.", true);
        return;
      }
      
      // Calcular automáticamente las fechas:
      // Desde: primer mes del período (primer día)
      const firstMesStr = periodo.meses[0].mes; // Formato "MM/YY"
      const [firstMonth, firstYearShort] = firstMesStr.split("/");
      const firstYear = "20" + firstYearShort;
      const desde = `${firstYear}-${firstMonth}-01`;
      
      // Hasta: anteúltimo mes del período (último día)
      const penultimateIndex = periodo.meses.length - 2;
      const penultimateMesStr = periodo.meses[penultimateIndex].mes; // "MM/YY"
      const [penultMonth, penultYearShort] = penultimateMesStr.split("/");
      const penultYear = "20" + penultYearShort;
      // Calcular el último día del mes: new Date(año, mesIndex+1, 0)
      const lastDay = new Date(parseInt(penultYear, 10), parseInt(penultMonth, 10), 0).getDate();
      const hasta = `${penultYear}-${penultMonth}-${lastDay.toString().padStart(2, "0")}`;
      
      // Actualiza la información en el modal para que el usuario sepa qué fechas se usan
      document.getElementById("inflation-dates-info").textContent =
        `Fechas de consulta: desde ${desde} hasta ${hasta}`;
      
      // Mostrar spinner y limpiar mensajes previos
      this.setLoading(true);

      this.showMessage("");
      
      try {
        const inflationData = await this.inflationClient.obtenerInflacionPorFecha(desde, hasta);
        // Actualiza la inflación en el período según los datos obtenidos
        this.updateInflationInPeriod(inflationData, selectedScope);
        // Actualiza el período en el localStorage y re-renderiza la tabla y métricas
        this.uiManager.periodoService.actualizarPeriodo(periodo);
        this.uiManager.periodDetailUI.renderMeses(periodo);
        this.uiManager.calcularYMostrarMetricas();
        this.showMessage("Inflación actualizada correctamente.", false);
      } catch (error) {
        console.error("Error al obtener la inflación: ", error);
        this.showMessage(`Error al obtener la inflación: ${error.message}`, true);
      } finally {
        this.setLoading(false);
      }
    });

    cancelBtn.addEventListener("click", () => {
      overlay.classList.add("hidden");
      overlay.setAttribute("aria-hidden", "true");
    });
  }

  showModal() {
    const periodo = this.uiManager.periodoSeleccionado;
    if (!periodo || !periodo.meses || periodo.meses.length < 2) {
      alert("El período debe tener al menos dos meses para actualizar la inflación.");
      return;
    }
    // Configura la información de fechas (se calculan al confirmarse la acción)
    document.getElementById("inflation-dates-info").textContent = "";
    const overlay = document.getElementById("auto-inflation-overlay");
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    this.showMessage("");
    this.setLoading(false);
  }

  showSpinner(show) {
    const spinner = document.getElementById("inflation-spinner");
    show? spinner.classList.remove("hidden") : spinner.classList.add("hidden");
  }

  showMessage(message, isError = false) {
    const messageDiv = document.getElementById("inflation-message");
    messageDiv.textContent = message;
    messageDiv.style.color = isError ? "red" : "green";
  }

  /**
   * Actualiza la inflación en cada mes del período, usando los datos de la API.
   * @param {Array<Object>} inflationData - Array de objetos con "fecha" y "valor"
   * @param {string} selectedScope - "all" o "empty"
   */
  updateInflationInPeriod(inflationData, selectedScope) {
    const periodo = this.uiManager.periodoSeleccionado;
    if (!periodo || !periodo.meses) return;
    
    // Crear un mapa: clave "MM/YY" => valor de inflación (valor)
    const inflationMap = {};
    inflationData.forEach(item => {
      // La API devuelve "fecha" en formato "YYYY-MM-DD"; extraemos mes y año.
      const [year, month] = item.fecha.split("-");
      const key = `${month}/${year.slice(-2)}`;
      inflationMap[key] = item.valor;
    });
    
    // Actualizar cada mes del período según el alcance seleccionado
    periodo.meses.forEach(mesObj => {
      if (selectedScope === "empty" && mesObj.inflacion && mesObj.inflacion !== 0) {
        return;
      }
      if (inflationMap[mesObj.mes] !== undefined) {
        mesObj.inflacion = inflationMap[mesObj.mes];
      } else {
        mesObj.inflacion = 0;
      }
    });
  }
}
