// Preload script for security
// This script runs before the renderer process loads

const { contextBridge } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true
});

console.log('صندوق فتوى - تطبيق سطح المكتب جاهز');
