// script.js

// Definición de la clave secreta para encriptar y desencriptar en localStorage
const secretKey = "mySuperSecretKey123";

/**
 * Clase PeriodoService
 * Se encarga de la gestión de datos: cargar, guardar y manipular periodos en el localStorage con encriptación.
 */
class PeriodoService {
  constructor() {
    this.periodos = [];
    this.cargarPeriodos();
  }

  cargarPeriodos() {
    const encryptedData = localStorage.getItem('periodos');
    if (encryptedData) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        this.periodos = JSON.parse(decryptedData);
      } catch (err) {
        console.error("Error al desencriptar periodos:", err);
        this.periodos = [];
      }
    } else {
      this.periodos = [];
    }
  }

  guardarPeriodos() {
    try {
      const data = JSON.stringify(this.periodos);
      const encryptedData = CryptoJS.AES.encrypt(data, secretKey).toString();
      localStorage.setItem('periodos', encryptedData);
    } catch (err) {
      console.error("Error al encriptar periodos:", err);
    }
  }

  crearPeriodo(nombre) {
    const nuevoPeriodo = {
      id: Date.now().toString(),
      nombre,
      meses: [],
      fechaCreacion: new Date().toLocaleString(),
      ultimaActualizacion: new Date().toLocaleString()
    };
    this.periodos.push(nuevoPeriodo);
    this.guardarPeriodos();
    return nuevoPeriodo;
  }

  actualizarPeriodo(periodoActualizado) {
    const index = this.periodos.findIndex(p => p.id === periodoActualizado.id);
    if (index !== -1) {
      periodoActualizado.ultimaActualizacion = new Date().toLocaleString();
      this.periodos[index] = periodoActualizado;
      this.guardarPeriodos();
    }
  }

  eliminarPeriodo(id) {
    this.periodos = this.periodos.filter(p => p.id !== id);
    this.guardarPeriodos();
  }

  obtenerPeriodos() {
    return this.periodos;
  }

  obtenerPeriodoPorId(id) {
    return this.periodos.find(p => p.id === id);
  }
}

/**
 * Clase MetricsCalculator
 * Realiza todos los cálculos financieros a partir de la información del periodo.
 */
class MetricsCalculator {
  calcular(periodo) {
    // Calcular sumaTotal para cada mes: sumaTotal = ingresoLocal + (ingresoExtranjera * tipoCambio)
    const mesesConSuma = periodo.meses.map(mes => ({
      ...mes,
      sumaTotal: mes.ingresoLocal + (mes.ingresoExtranjera * mes.tipoCambio)
    }));

    const valorInicial = mesesConSuma[0].sumaTotal;
    const valorFinal = mesesConSuma[mesesConSuma.length - 1].sumaTotal;
    const rnNominal = (valorFinal - valorInicial) / valorInicial;

    // Inflación Acumulada (divisa local)
    const factorInflacion = periodo.meses.reduce((acum, mes) => acum * (1 + mes.inflacion / 100), 1);
    const inflacionAcumulada = factorInflacion - 1;

    // Inflación Acumulada Ajustada para Ingresos Convertidos
    const factorAjustado = periodo.meses.reduce((acum, mes) => {
      const ajuste = mes.variacionTC !== 0
        ? (1 + mes.inflacion / 100) / (1 + mes.variacionTC / 100)
        : (1 + mes.inflacion / 100);
      return acum * ajuste;
    }, 1);
    const inflacionAcumuladaAjustada = factorAjustado - 1;

    // Rendimiento Real (usando inflación acumulada general)
    const rendimientoReal = ((1 + rnNominal) / (1 + inflacionAcumulada)) - 1;

    // Poder Adquisitivo Real y Ganancia Real
    const poderAdquisitivo = valorFinal / factorInflacion;
    const gananciaReal = poderAdquisitivo - valorInicial;
    const porcentajeGananciaReal = (gananciaReal / valorInicial) * 100;

    return {
      valorInicial,
      valorFinal,
      rnNominal,
      inflacionAcumulada,
      inflacionAcumuladaAjustada,
      rendimientoReal,
      poderAdquisitivo,
      gananciaReal,
      porcentajeGananciaReal
    };
  }
}

/**
 * Clase UIManager
 * Maneja la interacción con el DOM y la comunicación entre la UI y los servicios.
 * Se implementan vistas separadas para Home (listado de periodos), Detalle (edición de meses) y Resultados.
 */
class UIManager {
  constructor() {
    this.periodoService = new PeriodoService();
    this.metricsCalculator = new MetricsCalculator();
    this.periodoSeleccionado = null;
    this.cacheSelectors();
    this.bindEvents();
    this.mostrarHome();
  }

  cacheSelectors() {
    // Vistas
    this.$viewHome = document.getElementById('view-home');
    this.$viewDetalle = document.getElementById('view-detalle');
    this.$viewResultados = document.getElementById('view-resultados');
    // Elementos Home
    this.$periodosLista = document.getElementById('periodos-lista');
    this.$btnNuevoPeriodo = document.getElementById('btn-nuevo-periodo');
    // Elementos Detalle
    this.$periodoNombre = document.getElementById('periodo-nombre');
    this.$mesesLista = document.getElementById('meses-lista');
    this.$btnAgregarMes = document.getElementById('btn-agregar-mes');
    this.$btnRepetirMes = document.getElementById('btn-repetir-mes');
    this.$btnGuardarPeriodo = document.getElementById('btn-guardar-periodo');
    this.$btnVerResultados = document.getElementById('btn-ver-resultados');
    this.$btnVolverHome = document.getElementById('btn-volver-home');
    // Elementos Resultados
    this.$metrics = document.getElementById('metrics');
    this.$btnVolverDetalle = document.getElementById('btn-volver-detalle');
    this.$btnVolverHome2 = document.getElementById('btn-volver-home2');
    // Menú lateral
    this.$menuGestionPeriodos = document.getElementById('menu-gestion-periodos');
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
  }

  // Navegación entre vistas
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

  // Renderiza el listado de periodos en la vista Home
  renderPeriodos() {
    const periodos = this.periodoService.obtenerPeriodos();
    this.$periodosLista.innerHTML = '';
    if (periodos.length === 0) {
      this.$periodosLista.innerHTML = '<p>No hay periodos creados.</p>';
      return;
    }
    periodos.forEach(periodo => {
      const card = this.createPeriodoCard(periodo);
      this.$periodosLista.appendChild(card);
    });
  }

  // Crea la tarjeta de un periodo (incluye ganancia real)
  createPeriodoCard(periodo) {
    // Si el periodo tiene métricas calculadas (gananciaReal) no se recalcula aquí
    const ganancia = (periodo.gananciaReal !== undefined)
      ? periodo.gananciaReal.toFixed(2)
      : "N/A";
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${periodo.nombre}</h3>
      <p><strong>Meses:</strong> ${periodo.meses.length}</p>
      <p><strong>Creado:</strong> ${periodo.fechaCreacion}</p>
      <p><strong>Última actualización:</strong> ${periodo.ultimaActualizacion}</p>
      <p class="ganancia-real"><strong>Ganancia Real:</strong> ${ganancia}</p>
      <div class="acciones">
        <button onclick="uiManager.handleSeleccionarPeriodo('${periodo.id}')" aria-label="Editar Periodo">Editar</button>
        <button onclick="uiManager.handleEliminarPeriodo('${periodo.id}')" aria-label="Eliminar Periodo">Eliminar</button>
        <button onclick="uiManager.handleVerResultados('${periodo.id}')" aria-label="Ver Resultados">Resultados</button>
      </div>
    `;
    return card;
  }

  handleNuevoPeriodo() {
    const nombre = prompt("Ingrese el nombre del nuevo periodo (ej. '2024 - Q1')");
    if (!nombre) return;
    this.periodoService.crearPeriodo(nombre);
    this.renderPeriodos();
  }

  handleEliminarPeriodo(id) {
    if (confirm("¿Está seguro de eliminar este periodo?")) {
      this.periodoService.eliminarPeriodo(id);
      if (this.periodoSeleccionado && this.periodoSeleccionado.id === id) {
        this.periodoSeleccionado = null;
      }
      this.renderPeriodos();
    }
  }

  // Al seleccionar un periodo, se carga en la vista Detalle
  handleSeleccionarPeriodo(id) {
    this.periodoSeleccionado = this.periodoService.obtenerPeriodoPorId(id);
    if (!this.periodoSeleccionado) return;
    this.mostrarDetalle();
  }

  // Método para saltar directamente a la vista de Resultados desde Home
  handleVerResultados(id) {
    this.periodoSeleccionado = this.periodoService.obtenerPeriodoPorId(id);
    if (!this.periodoSeleccionado) return;
    this.mostrarResultados();
  }

  // Renderiza los meses en la vista Detalle
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

  // Crea la tarjeta para un mes
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

  // Copia los datos del último mes para crear un nuevo mes
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

  actualizarMes(index, campo, valor) {
    if (!this.periodoSeleccionado) return;
    this.periodoSeleccionado.meses[index][campo] = (campo === 'mes') ? valor : parseFloat(valor) || 0;
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

  // Calcula métricas, actualiza la ganancia real en el objeto y muestra el reporte en la vista Resultados
  calcularYMostrarMetricas() {
    if (!this.periodoSeleccionado || this.periodoSeleccionado.meses.length === 0) return;
    const metrics = this.metricsCalculator.calcular(this.periodoSeleccionado);
    // Almacenamos la ganancia real en el modelo del periodo para mostrarla en la tarjeta de Home
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

const uiManager = new UIManager();
window.uiManager = uiManager;
