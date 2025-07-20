const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config.env') });

const connections = {};

function getConferenceDb(code) {
  console.log('[DEBUG] getConferenceDb called with code:', code);
  if (connections[code]) {
    console.log('[DEBUG] Returning cached connection for code:', code);
    return connections[code];
  }
  const envPath = path.join(__dirname, `../../conferences/${code}/.env`);
  console.log('[DEBUG] Looking for env file at:', envPath);
  if (!fs.existsSync(envPath)) {
    console.log('[DEBUG] Conference .env not found for code:', code);
    throw new Error('Conference .env not found');
  }
  const env = fs.readFileSync(envPath, 'utf-8');
  console.log('[DEBUG] Read env file:', env);
  const uriMatch = env.match(/MONGODB_URI=(.+)/);
  console.log('[DEBUG] URI match:', uriMatch);
  if (!uriMatch) {
    console.log('[DEBUG] MONGODB_URI not found in .env for code:', code);
    throw new Error('MONGODB_URI not found in .env');
  }
  const uri = uriMatch[1].trim();
  console.log('[DEBUG] Connecting to MongoDB URI:', uri);
  const conn = mongoose.createConnection(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  connections[code] = conn;
  console.log('[DEBUG] Created and cached new connection for code:', code);
  return conn;
}

module.exports = { getConferenceDb }; 