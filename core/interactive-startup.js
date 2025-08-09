/**
 * SISTEMA INTERACTIVO DE INICIO - ULTRA OPTIMIZADO
 * Permite elegir entre QR o Pairing Code de forma elegante
 */
import { createInterface } from 'readline';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { logger } from '../services/logger.js';
import fs from 'fs';
import path from 'path';

/**
 * Interfaz interactiva para elegir modo de conexión
 */
export async function interactiveStartup() {
  // PASO 1: Verificar si ya existe sesión válida
  const existingSession = await checkExistingSession();
  if (existingSession) {
    logger.info('🎯 Sesión existente detectada - Conectando automáticamente...');
    return existingSession;
  }

  // PASO 2: Si hay variables de entorno configuradas, usar esas
  if (process.env.USE_PAIRING_CODE === 'true' && process.env.PHONE_NUMBER) {
    logger.info('🔧 Configuración detectada - Usando pairing code automático');
    return {
      usePairingCode: true,
      phoneNumber: process.env.PHONE_NUMBER
    };
  }

  if (process.env.USE_PAIRING_CODE === 'false') {
    logger.info('🔧 Configuración detectada - Usando QR automático');
    return {
      usePairingCode: false,
      phoneNumber: null
    };
  }

  // PASO 3: Primera vez - mostrar menú interactivo
  const config = await showConnectionMenu();
  
  // PASO 4: Guardar configuración para futuras ejecuciones
  await saveConnectionConfig(config);
  
  return config;
}

/**
 * Mostrar menú de selección de conexión
 */
async function showConnectionMenu() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Banner de selección
  console.log('\n' + '🔥'.repeat(70));
  console.log(gradient.pastel('       🚀 SELECCIONA TU MÉTODO DE CONEXIÓN 🚀'));
  console.log('🔥'.repeat(70));
  console.log();
  
  console.log(chalk.cyan('📱 [1] ') + chalk.white('CÓDIGO QR') + chalk.gray(' - Escanear con WhatsApp'));
  console.log(chalk.green('🔐 [2] ') + chalk.white('PAIRING CODE') + chalk.gray(' - Código de 8 dígitos'));
  console.log();
  
  const choice = await askQuestion(rl, chalk.yellow('💫 Elige tu opción (1 o 2): '));
  
  if (choice === '1') {
    rl.close();
    console.log(chalk.cyan('\n✅ Modo QR seleccionado'));
    return {
      usePairingCode: false,
      phoneNumber: null
    };
  } else if (choice === '2') {
    // Solicitar número de teléfono
    console.log(chalk.green('\n🔐 Configurando Pairing Code...'));
    console.log(chalk.gray('Formatos soportados:'));
    console.log(chalk.gray('  • Brasil: 5511999999999 o 11999999999'));
    console.log(chalk.gray('  • EE.UU.: 1234567890'));
    console.log(chalk.gray('  • Internacional: +[código][número]'));
    console.log();
    
    const phoneNumber = await askQuestion(rl, chalk.yellow('📞 Ingresa tu número (con código de país): '));
    rl.close();
    
    // Validar y limpiar número
    const cleanPhone = validateAndCleanPhone(phoneNumber);
    if (!cleanPhone) {
      console.log(chalk.red('\n❌ Número inválido. Reinicia y prueba de nuevo.'));
      process.exit(1);
    }
    
    console.log(chalk.green(`\n✅ Pairing Code configurado para: +${cleanPhone}`));
    return {
      usePairingCode: true,
      phoneNumber: cleanPhone
    };
  } else {
    rl.close();
    console.log(chalk.red('\n❌ Opción inválida. Usando QR por defecto.'));
    return {
      usePairingCode: false,
      phoneNumber: null
    };
  }
}

/**
 * Función auxiliar para hacer preguntas
 */
function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Validar y limpiar número de teléfono
 */
function validateAndCleanPhone(phone) {
  if (!phone) return null;
  
  // Limpiar número - solo dígitos
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // Diferentes validaciones según el formato
  if (cleaned.startsWith('55') && cleaned.length >= 12 && cleaned.length <= 13) {
    // Brasil: 55 + área + número
    return cleaned;
  } else if (cleaned.startsWith('1') && cleaned.length === 11) {
    // EE.UU./Canadá: 1 + área + número
    return cleaned;
  } else if (cleaned.length >= 10 && cleaned.length <= 15) {
    // Formato internacional genérico
    return cleaned;
  } else if (cleaned.length === 10) {
    // Número sin código de país (asumir EE.UU.)
    return '1' + cleaned;
  }
  
  return null;
}

/**
 * Mostrar configuración final elegida
 */
export function displaySelectedConfiguration(config) {
  console.log('\n' + '🔥'.repeat(70));
  console.log(gradient.pastel('         ⚙️  CONFIGURACIÓN APLICADA ⚙️'));
  console.log('🔥'.repeat(70));
  
  if (config.usePairingCode) {
    console.log(chalk.green('🔐 MÉTODO: ') + chalk.white('Pairing Code'));
    console.log(chalk.green('📱 NÚMERO: ') + chalk.white(`+${config.phoneNumber}`));
  } else {
    console.log(chalk.cyan('📱 MÉTODO: ') + chalk.white('Código QR'));
    console.log(chalk.gray('📋 ACCIÓN: Escanear QR con WhatsApp'));
  }
  
  console.log('🔥'.repeat(70));
  console.log(chalk.yellow('🚀 Iniciando conexión...'));
  console.log();
}

/**
 * Verificar si existe una sesión válida previa
 */
async function checkExistingSession() {
  const sessionDir = './MojiSession';
  const configFile = './bot-config.json';
  
  try {
    // Verificar si existe directorio de sesión con archivos válidos
    if (!fs.existsSync(sessionDir)) {
      return null;
    }
    
    const sessionFiles = fs.readdirSync(sessionDir);
    const hasCredentials = sessionFiles.some(file => file === 'creds.json');
    const hasSessionData = sessionFiles.some(file => file.startsWith('session-'));
    
    if (!hasCredentials || !hasSessionData) {
      return null;
    }
    
    // Leer configuración guardada si existe
    if (fs.existsSync(configFile)) {
      try {
        const savedConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        if (savedConfig.phoneNumber) {
          console.log(chalk.green(`🎯 Sesión detectada para: +${savedConfig.phoneNumber}`));
          console.log(chalk.cyan('🔄 Conectando automáticamente con sesión guardada...'));
          return savedConfig;
        }
      } catch (error) {
        logger.debug('Error leyendo configuración guardada:', error.message);
        // Si hay error leyendo el archivo, continuar sin configuración
      }
    }
    
    // Si hay sesión pero no configuración, asumir conexión existente
    console.log(chalk.green('🎯 Sesión WhatsApp detectada - Conectando automáticamente...'));
    return {
      usePairingCode: false, // Por defecto QR si no sabemos el método
      phoneNumber: null,
      hasExistingSession: true
    };
    
  } catch (error) {
    logger.debug('Error verificando sesión existente:', error.message);
    return null;
  }
}

/**
 * Guardar configuración de conexión para futuras ejecuciones
 */
async function saveConnectionConfig(config) {
  const configFile = './bot-config.json';
  
  try {
    const configData = {
      usePairingCode: config.usePairingCode,
      phoneNumber: config.phoneNumber,
      savedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    fs.writeFileSync(configFile, JSON.stringify(configData, null, 2));
    logger.info('✅ Configuración guardada para futuras ejecuciones');
    
  } catch (error) {
    logger.warn('Error guardando configuración:', error.message);
  }
}