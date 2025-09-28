const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors()); 
app.use(express.json()); 

// Conexión a MongoDB
// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(error => console.log('❌ Error MongoDB:', error));

// Rutas
const authRoutes = require('./routes/auth');
const recicladorRoutes = require('./routes/recicladores');

app.use('/api/auth', authRoutes);
app.use('/api/recicladores', recicladorRoutes);

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ 
    mensaje: 'API ReciclaCoquimbo funcionando ✅',
    version: '1.0.0'
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`🔐 Endpoints de auth disponibles en: http://localhost:${PORT}/api/auth`);
});