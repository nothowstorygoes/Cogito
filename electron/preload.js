const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  removeListener: (channel, func) => ipcRenderer.removeListener(channel, func),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on("update-downloaded", callback),
  sendUpdateAction: (action) => ipcRenderer.send("user-update-action", action),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  examShelfOnboardingExists: () =>
    ipcRenderer.invoke("exam-shelf-onboarding-exists"),
});
