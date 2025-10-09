const { contextBridge, ipcRenderer } = require("electron");

function applyThemeVars(theme) {
  try {
    const root = document.documentElement;
    if (!root || !theme) return;
    if (theme.primary) root.style.setProperty('--color-primary', theme.primary);
    if (theme.secondary) root.style.setProperty('--color-secondary', theme.secondary);
  } catch {}
}

// Load and apply theme ASAP
ipcRenderer.invoke('get-theme').then((theme) => {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => applyThemeVars(theme));
  } else {
    applyThemeVars(theme);
  }
});

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
  // Theme
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  // Timer functions
  timerStart: () => ipcRenderer.send("timer-start"),
  timerPause: () => ipcRenderer.send("timer-pause"),
  timerGetSeconds: () => ipcRenderer.invoke("timer-get-seconds"),
  timerReset: () => ipcRenderer.send("timer-reset"),
  onTimerUpdate: (callback) => ipcRenderer.on("timer-update", (event, seconds) => callback(seconds)),
});
