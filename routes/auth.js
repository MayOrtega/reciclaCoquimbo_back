const express = require('express');
const jwt = require('jsonwebtoken');
const Reciclador = require('../models/Reciclador');
const router = express.Router();

// 🎯 GENERAR TOKEN JWT
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secreto_desarrollo', {
    expiresIn: '1h' // ✅ Token expira en 1 hora
  });
};

// 🔐 LOGIN DE RECICLADOR
router.post('/login', async (req, res) => {
  try {
    const { email, clave } = req.body;

    // Validar campos
    if (!email || !clave) {
      return res.status(400).json({ 
        error: 'Email y clave son requeridos' 
      });
    }

    // Buscar reciclador por email
    const reciclador = await Reciclador.findOne({ email });
    if (!reciclador) {
      return res.status(401).json({ 
        error: 'Email o clave incorrectos' 
      });
    }

    // Verificar clave
    const claveValida = await reciclador.compararClave(clave);
    if (!claveValida) {
      return res.status(401).json({ 
        error: 'Email o clave incorrectos' 
      });
    }

    // Generar token
    const token = generarToken(reciclador._id);

    // Responder con datos (excluyendo clave)
    const { clave: _, ...recicladorSinClave } = reciclador.toObject();
    
    res.json({
      mensaje: 'Login exitoso',
      token,
      reciclador: recicladorSinClave
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor en login' 
    });
  }
});

module.exports = router;