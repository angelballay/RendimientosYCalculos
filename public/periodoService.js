/**
 * periodoService.js
 * 
 * PeriodoService
 * Maneja la gestión de datos: cargar, guardar y manipular periodos en el localStorage con encriptación.
 */
import CryptoJS from 'https://cdn.skypack.dev/crypto-js';
import { CONFIG } from './config.js';

const secretKey = CONFIG.SECRET_KEY;

export class PeriodoService {
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
