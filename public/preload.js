const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  writeFile: (filePath, content) => ipcRenderer.invoke('writeFile', filePath, content)
}); 