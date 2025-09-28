const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://May:cenco123@cluster0.eabdsil.mongodb.net/reciclaCoquimbo?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ ¡Conexión exitosa a MongoDB Atlas!');
    console.log('📊 Cluster: Cluster0');
    console.log('🗄️  Base de datos: reciclaCoquimbo');
    
    // Verificar si podemos crear una colección
    const Reciclador = mongoose.model('Test', new mongoose.Schema({ name: String }));
    await Reciclador.create({ name: 'test' });
    console.log('✅ Escritura en la BD funcionando');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
  }
}

testConnection();