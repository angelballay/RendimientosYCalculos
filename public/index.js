/**
 * index.js
 * 
 * Archivo principal que importa el módulo de UI y arranca la aplicación.
 */
import { UIManager } from './uiManager.js';

const uiManager = new UIManager();
window.uiManager = uiManager;
