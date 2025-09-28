const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const recicladorSchema = new mongoose.Schema({
  nombre: { type: String, required: [true, 'El nombre es requerido'], trim: true },
  apellido: { type: String, required: [true, 'El apellido es requerido'], trim: true },
  telefono: { type: String, required: [true, 'El teléfono es requerido'], trim: true },
  instagram: { type: String, default: '' },
  materiales: [{ type: String }], 
  retiroDomicilio: { type: Boolean, default: false },
  email: { type: String, required: true, unique: true, lowercase: true },
  clave: { type: String, required: [true, 'La clave es requerida'], minlength: [4, 'La clave debe tener al menos 4 caracteres'] }
});

// 🚀 ENCRIPTAR CLAVE ANTES DE GUARDAR
recicladorSchema.pre('save', async function(next) {
  if (!this.isModified('clave')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.clave = await bcrypt.hash(this.clave, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🚀 MÉTODO PARA COMPARAR CLAVES
recicladorSchema.methods.compararClave = async function(claveIngresada) {
  return await bcrypt.compare(claveIngresada, this.clave);
};

module.exports = mongoose.model('Reciclador', recicladorSchema);