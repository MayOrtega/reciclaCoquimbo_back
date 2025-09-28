const jwt = require('jsonwebtoken');
const Reciclador = require('../models/Reciclador');

const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Acceso denegado. Token no proporcionado.' 
      });
    }

    // Verificar token
    const decodificado = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'secreto_desarrollo'
    );

    // Buscar reciclador por ID del token
    const reciclador = await Reciclador.findById(decodificado.id).select('-clave');
    
    if (!reciclador) {
      return res.status(401).json({ 
        error: 'Token inválido. Reciclador no encontrado.' 
      });
    }

    // Agregar reciclador al request
    req.reciclador = reciclador;
    next();

  } catch (error) {
    console.error('Error en middleware de auth:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado.' });
    }

    res.status(500).json({ error: 'Error en autenticación.' });
  }
};

module.exports = authMiddleware;