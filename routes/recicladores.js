const express = require('express');
const router = express.Router();
const Reciclador = require('../models/Reciclador');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');

// 🆕 FUNCIÓN AUXILIAR PARA REGISTRO - DEBE IR PRIMERO
async function crearRecicladorDesdeRegistro(req, res) {
  const { nombre, apellido, telefono, email, clave } = req.body;

  // Validar campos requeridos
  if (!nombre || !apellido || !telefono || !email || !clave) {
    return res.status(400).json({ 
      error: 'Todos los campos son requeridos' 
    });
  }

  // Crear nuevo reciclador
  const nuevoReciclador = new Reciclador(req.body);
  const guardado = await nuevoReciclador.save();

  // Generar token
  const token = jwt.sign(
    { id: guardado._id }, 
    process.env.JWT_SECRET || 'secreto_desarrollo', 
    { expiresIn: '1h' }
  );

  // Responder sin la clave
  const { clave: _, ...recicladorSinClave } = guardado.toObject();
  
  res.status(201).json({
    mensaje: 'Registro exitoso',
    token,
    reciclador: recicladorSinClave
  });
}

// GET - Obtener todos los recicladores
router.get('/', async (req, res) => {
  try {
    const recicladores = await Reciclador.find({}, { clave: 0 });
    res.json(recicladores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nuevo reciclador
router.post('/', async (req, res) => {
  try {
    const nuevoReciclador = new Reciclador(req.body);
    const guardado = await nuevoReciclador.save();
    
    const { clave, ...recicladorSinClave } = guardado.toObject();
    res.status(201).json(recicladorSinClave);
    
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'El Email ya está registrado' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// GET - Obtener un reciclador por ID
router.get('/:id', async (req, res) => {
  try {
    const reciclador = await Reciclador.findById(req.params.id, { clave: 0 });
    if (!reciclador) return res.status(404).json({ error: 'Reciclador no encontrado' });
    res.json(reciclador);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Actualizar reciclador
router.put('/:id', async (req, res) => {
  try {
    const actualizado = await Reciclador.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).select('-clave');
    
    if (!actualizado) return res.status(404).json({ error: 'Reciclador no encontrado' });
    res.json(actualizado);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'El Email ya está registrado' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// DELETE - Eliminar reciclador
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️  Solicitando eliminar reciclador ID:', req.params.id);
    
    const eliminado = await Reciclador.findByIdAndDelete(req.params.id);
    
    if (!eliminado) {
      return res.status(404).json({ error: 'Reciclador no encontrado' });
    }
    
    console.log('✅ Reciclador eliminado:', eliminado.email);
    res.json({ 
      mensaje: 'Reciclador eliminado exitosamente',
      datos: {
        id: eliminado._id,
        nombre: `${eliminado.nombre} ${eliminado.apellido}`,
        email: eliminado.email
      }
    });
    
  } catch (error) {
    console.error('❌ Error en DELETE:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🆕 FORMULARIO UNIFICADO - REGISTRO O ACTUALIZACIÓN
router.post('/perfil', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      // 🔐 USUARIO LOGUEADO → ACTUALIZAR PERFIL
      try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET || 'secreto_desarrollo');
        const recicladorExistente = await Reciclador.findById(decodificado.id);
        
        if (!recicladorExistente) {
          return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        // Preparar datos para actualización
        const datosActualizacion = { ...req.body };
        
        // Si envía nueva clave, encriptarla
        if (datosActualizacion.clave) {
          const salt = await bcrypt.genSalt(12);
          datosActualizacion.clave = await bcrypt.hash(datosActualizacion.clave, salt);
        }

        // Actualizar perfil
        const actualizado = await Reciclador.findByIdAndUpdate(
          recicladorExistente._id,
          datosActualizacion,
          { new: true }
        ).select('-clave');

        res.json({
          mensaje: 'Perfil actualizado exitosamente',
          reciclador: actualizado
        });

      } catch (error) {
        // Token inválido → tratar como registro nuevo
        return await crearRecicladorDesdeRegistro(req, res);
      }
    } else {
      // 🔓 USUARIO NO LOGUEADO → REGISTRO NUEVO
      await crearRecicladorDesdeRegistro(req, res);
    }
    
  } catch (error) {
    console.error('Error en perfil unificado:', error);
    
    if (error.code === 11000) {
      res.status(400).json({ error: 'El email ya está registrado' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// 👤 OBTENER MI PERFIL (protegido)
router.get('/mi-perfil', authMiddleware, async (req, res) => {
  try {
    res.json(req.reciclador);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;