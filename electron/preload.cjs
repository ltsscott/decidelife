const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("decideLifeWidget", {
  getSettings: () => ipcRenderer.invoke("widget:get-settings"),
  updateSettings: (settings) => ipcRenderer.invoke("widget:update-settings", settings),
  resizeToContent: (size) => ipcRenderer.send("widget:resize-to-content", size)
});
