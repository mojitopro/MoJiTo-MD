
/**
 * Configuración de WebSocket optimizada para Termux
 * Sin dependencias nativas problemáticas
 */

export const getWebSocketConfig = () => {
  const isTermux = !!(
    process.env.PREFIX?.includes('com.termux') ||
    process.env.TERMUX_VERSION ||
    process.env.ANDROID_DATA
  );

  const baseConfig = {
    perMessageDeflate: false, // Desactivar compresión para evitar dependencias nativas
    maxPayload: 32 * 1024 * 1024, // 32MB
    skipUTF8Validation: false,
  };

  if (isTermux) {
    return {
      ...baseConfig,
      // Configuración específica para Termux
      handshakeTimeout: 30000,
      maxCompressedSize: 64 * 1024,
      maxUncompressedSize: 256 * 1024,
      // No usar bufferutil ni utf-8-validate
      skipUTF8Validation: true,
    };
  }

  return baseConfig;
};

export default getWebSocketConfig;
