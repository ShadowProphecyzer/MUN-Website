// Test script for World-Wide Message Feature
// This script demonstrates how the God role can send world-wide messages

const io = require('socket.io-client');

console.log('🌍 World-Wide Message Test Script');
console.log('=====================================');

// Connect to the server
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log('Socket ID:', socket.id);
  
  // Listen for world-wide messages
  socket.on('worldWideMessage', (data) => {
    console.log('\n👑 WORDS OF ENLIGHTENMENT RECEIVED!');
    console.log('=====================================');
    console.log('Message:', data.message);
    console.log('Timestamp:', new Date(data.timestamp).toLocaleString());
    console.log('=====================================\n');
  });
  
  console.log('\n📡 Listening for world-wide messages...');
  console.log('💡 To test this feature:');
  console.log('1. Start the server (npm start)');
  console.log('2. Open the dashboard in a browser');
  console.log('3. Login as the God user (email from GOD_EMAIL env var)');
  console.log('4. Click "✨ Send Words of Enlightenment" button');
  console.log('5. Enter a message and send it');
  console.log('6. Watch this console for the received message!');
  console.log('\n🎯 The popup should appear on all connected pages!');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
  console.log('💡 Make sure the server is running on port 5000');
});

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n👋 Disconnecting...');
  socket.disconnect();
  process.exit(0);
}); 