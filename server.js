// server.js
const express = require('express');
const path = require('path');
const CryptoJS = require('crypto-js');
const app = express();
const port = process.env.PORT || 3000;

// La clave secreta se obtiene de la variable de entorno, o se usa un valor por defecto (no recomendado en producción)
const SECRET_KEY = process.env.SECRET_KEY || 'defaultBackendSecretKey';

app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para encriptar datos
app.post('/encrypt', (req, res) => {
  const { data, key } = req.body;
  if (!data || !key) {
    return res.status(400).json({ error: 'Se requieren "data" y "key"' });
  }
  try {
    // Validar que "data" sea de tipo string (se recomienda usar JSON.stringify si se envía un objeto)
    if (typeof data !== 'string') {
      return res.status(400).json({ error: '"data" debe ser una cadena de texto' });
    }
    const encryptedData = CryptoJS.AES.encrypt(data, key).toString();
    res.json({ encryptedData });
  } catch (err) {
    console.error("Error en /encrypt:", err);
    res.status(500).json({ error: 'Error al encriptar' });
  }
});

// Endpoint para desencriptar datos
app.post('/decrypt', (req, res) => {
  const { encryptedData, key } = req.body;
  if (!encryptedData || !key) {
    return res.status(400).json({ error: 'Se requieren "encryptedData" y "key"' });
  }
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedData) {
      return res.status(400).json({ error: 'La desencriptación falló, verifique la clave y el dato encriptado' });
    }
    res.json({ decryptedData });
  } catch (err) {
    console.error("Error en /decrypt:", err);
    res.status(500).json({ error: 'Error al desencriptar' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
