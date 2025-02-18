// ModalManager.js
export class ModalManager {
    constructor(uiManager) {
      this.uiManager = uiManager;
      this.$deleteConfirmationModal = document.getElementById("delete-confirmation-modal");
      this.$confirmDeleteBtn = document.getElementById("confirm-delete-btn");
      this.$cancelDeleteBtn = document.getElementById("cancel-delete-btn");
      this.periodoAEliminar = null;
  
      this.bindEvents();
    }
  
    bindEvents() {
      this.$confirmDeleteBtn.addEventListener("click", () => {
        if (this.periodoAEliminar) {
          this.uiManager.handleEliminarPeriodo(this.periodoAEliminar);
        }
        this.hideDeleteConfirmation();
      });
  
      this.$cancelDeleteBtn.addEventListener("click", () => this.hideDeleteConfirmation());
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
  }
  