// exchangeAutoFillUI.js
import CambioDolarBlue from "./CambioDolarBlue.js";

export class ExchangeAutoFillUI {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.cambioDolarBlue = new CambioDolarBlue();
    this.initModal();

    // Referencias a elementos que usaremos
    this.errorHTML = document.getElementById("exchange-error");
    this.overlay = document.getElementById("auto-exchange-overlay");
    this.formContent = document.getElementById("form-exchange-content");
    this.inputsBlock = document.getElementById("exchange-inputs");
    this.spinner = document.getElementById("inflation-spinner");

    this.bindEvents();
  }

  initModal() {
    const container = document.getElementById("auto-exchange-ui-container");
    container.innerHTML = `
      <div class="modal-overlay hidden" id="auto-exchange-overlay" aria-hidden="true">
        <div class="modal-content" role="dialog" aria-labelledby="autoExchangeModalTitle">
          
          <h3 id="autoExchangeModalTitle" class="modal-title">Completar Tipo de Cambio</h3>
          
          <div id="exchange-error" class="hidden">
            <h1></h1>
            <p></p>
          </div>
          
          <div id="form-exchange-content">
            <p id="parrafo-modal">Esta opción permite cargar automáticamente el tipo de cambio (Blue u Oficial) desde la API.</p>
            
            <div id="exchange-inputs">
              <label>
                <input type="radio" name="exchange-type" value="blue" checked />
                Usar Dólar Blue
              </label>
              <label>
                <input type="radio" name="exchange-type" value="oficial" />
                Usar Dólar Oficial
              </label>
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
            </div>
            
            <div id="modal-actions" class="modal-actions">
              <button id="auto-exchange-cancel" class="btn-neutral">Cancelar</button>
              <button id="auto-exchange-confirm" class="btn-success">Confirmar</button>
            </div>
          </div>
          <div id="inflation-spinner" class="spinner hidden"></div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Los elementos se crean tras initModal, así que debemos volver a tomarlos
    this.overlay = document.getElementById("auto-exchange-overlay");
    this.errorHTML = document.getElementById("exchange-error");
    this.formContent = document.getElementById("form-exchange-content");
    this.inputsBlock = document.getElementById("exchange-inputs");
    this.spinner = document.getElementById("inflation-spinner");
    this.modalActions = document.getElementById("modal-actions");
    this.confirmBtn = document.getElementById("auto-exchange-confirm");
    this.cancelBtn = document.getElementById("auto-exchange-cancel");

    this.confirmBtn.addEventListener("click", async () => {
      // Ocultamos errores previos
      this.hideError();
      // Mostramos spinner y deshabilitamos el botón
      this.setLoading(true);

      try {
        const selectedExchange = document.querySelector('input[name="exchange-type"]:checked').value;
        const selectedScope = document.querySelector('input[name="apply-scope"]:checked').value;

        await this.fillExchangeRates(selectedExchange, selectedScope);

        // Si todo va bien, cerramos el modal
        this.closeModal();

      } catch (err) {
        // En caso de error, mostramos error y ocultamos inputs
        this.showError("ERROR", err.message || err);
        this.hideInputs(); 
        this.modalActionHandler(true);
        this.showBtnCancel(true);
        this.showBtnConfirm(false);
      } finally {
        // Quitamos el spinner y habilitamos el botón
        this.setLoading(false);
      }
    });

    this.cancelBtn.addEventListener("click", () => {
      this.closeModal();
    });
  }

  showModal() {
    this.overlay.classList.remove("hidden");
    this.overlay.setAttribute("aria-hidden", "false");
    this.showBtnCancel(true);
    this.showBtnConfirm(true);
    this.modalActionHandler(true);
  }

  closeModal() {
    this.overlay.classList.add("hidden");
    this.overlay.setAttribute("aria-hidden", "true");
    // Restauramos el formulario para la próxima vez
    this.showInputs();
    this.hideError();
  }

  // ---- Manejo de error ----
  showError(errorTitle, errorDescription) {
    this.errorHTML.classList.remove("hidden");
    this.errorHTML.children[0].innerText = errorTitle;       // <h1>
    this.errorHTML.children[1].innerText = errorDescription; // <p>
  }

  hideError() {
    this.errorHTML.classList.add("hidden");
  }

  // ---- Manejo de inputs ----
  hideInputs() {
    this.inputsBlock.classList.add("hidden");
    document.getElementById("parrafo-modal").classList.add("hidden");
  }

  showInputs() {
    this.inputsBlock.classList.remove("hidden");
    document.getElementById("parrafo-modal").classList.remove("hidden");
  }

  modalActionHandler(show){
    this.showElement(this.modalActions,show);
  }

  showBtnCancel(show){
    this.showElement(this.cancelBtn,show);
  }

  showBtnConfirm(show){
    this.showElement(this.confirmBtn,show);
  }

  
  showElement(element,show){
    show ? element.classList.remove("hidden") : element.classList.add("hidden");
  }
  


  // ---- Manejo de spinner ----
  setLoading(isLoading) {
    if (isLoading) {
      this.spinner.classList.remove("hidden");
      // Ocultamos inputs mientras carga
      this.hideInputs();
     this.modalActionHandler(false)
    } else {
      this.spinner.classList.add("hidden");
      // Si no hay error visible, mostramos los inputs
      if (this.errorHTML.classList.contains("hidden")) {
        this.showInputs();
        this.modalActionHandler(true)
      }
    }
  }

  /**
   * Rellena los meses con el tipo de cambio obtenido de CambioDolarBlue.
   * @param {string} selectedExchange - "blue" u "oficial"
   * @param {string} selectedScope - "all" o "empty"
   */
  async fillExchangeRates(selectedExchange, selectedScope) {
    const periodo = this.uiManager.periodoSeleccionado;
    if (!periodo || !periodo.meses || periodo.meses.length === 0) {
      throw new Error("No hay meses para completar.");
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

    // Guardar en servicio y actualizar la UI
    this.uiManager.periodoService.actualizarPeriodo(periodo);
    this.uiManager.periodDetailUI.renderMeses(periodo);
    this.uiManager.calcularYMostrarMetricas();

    if (errores.length > 0) {
      throw new Error(
        `Se completó el TC con errores en los siguientes meses: ${errores.join(", ")}. ` +
        `Se asignó "0" a esos meses.`
      );
    }
  }
}
