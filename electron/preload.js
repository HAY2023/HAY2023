const { contextBridge } = require('electron');

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    platform: process.platform,
});
