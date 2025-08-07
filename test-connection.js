/**
 * Test script to verify connection functionality
 * Tests both QR and pairing code modes
 */
import { initializeConnection } from './core/connection-fixed.js';
import { logger } from './services/logger.js';

async function testConnections() {
  console.log('🧪 Testing WhatsApp connection system...\n');
  
  // Test 1: QR Code mode
  console.log('📱 Test 1: QR Code Mode');
  try {
    const qrConn = await initializeConnection({ usePairingCode: false });
    console.log('✅ QR mode connection created successfully');
    
    // Close connection
    if (qrConn) {
      await qrConn.logout();
      console.log('🔐 QR connection closed');
    }
  } catch (error) {
    console.log('❌ QR mode failed:', error.message);
  }
  
  console.log('\n' + '─'.repeat(50) + '\n');
  
  // Test 2: Pairing Code mode (with test number)
  console.log('🔐 Test 2: Pairing Code Mode');
  try {
    const pairConn = await initializeConnection({ 
      usePairingCode: true, 
      phoneNumber: '5511999999999' // Test number
    });
    console.log('✅ Pairing code mode connection created successfully');
    
    // Close connection
    if (pairConn) {
      await pairConn.logout();
      console.log('🔐 Pairing connection closed');
    }
  } catch (error) {
    console.log('❌ Pairing mode failed:', error.message);
  }
  
  console.log('\n🎉 Connection tests completed!');
}

// Run tests only if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnections().catch(console.error);
}

export { testConnections };