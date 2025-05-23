"use strict";
const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
let viteProcess;
function startVite() {
  viteProcess = spawn("npm", ["run", "dev:renderer"], {
    shell: true,
    stdio: "inherit"
  });
  app.on("will-quit", () => {
    if (viteProcess) viteProcess.kill();
  });
}
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}
app.whenReady().then(() => {
  if (!app.isPackaged) startVite();
  createWindow();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
