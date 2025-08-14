
/**
 * Termux Compatibility Layer
 * Maneja dependencias problemáticas en entornos ARM64/Android
 */

// Verificar si estamos en Termux
const isTermux = !!(
  process.env.PREFIX?.includes('com.termux') ||
  process.env.TERMUX_VERSION ||
  process.env.ANDROID_DATA
);

if (isTermux) {
  console.log('🤖 Aplicando compatibilidad Termux...');
  
  // Configurar variables de entorno para optimización
  process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=512';
  process.env.UV_THREADPOOL_SIZE = '4';
  
  // Mock bufferutil si no está disponible
  try {
    require('bufferutil');
  } catch (error) {
    console.log('📦 bufferutil no disponible - usando polyfill JavaScript');
    
    // Crear mock de bufferutil usando Buffer nativo
    const bufferUtil = {
      mask: (source, mask, output, offset, length) => {
        for (let i = 0; i < length; i++) {
          output[offset + i] = source[i] ^ mask[i % 4];
        }
      },
      unmask: (buffer, mask) => {
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] ^= mask[i % 4];
        }
      }
    };
    
    // Registrar el mock en el cache de módulos
    require.cache['bufferutil'] = {
      exports: bufferUtil,
      loaded: true
    };
  }
}

module.exports = {
  isTermux,
  setupTermuxEnvironment: () => {
    if (!isTermux) return;
    
    // Configuraciones adicionales si es necesario
    console.log('✅ Entorno Termux configurado correctamente');
  }
};
