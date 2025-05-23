const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function getDataPath() {
  return path.join(app.getPath('userData'), 'cogito-data.json');
}

// Handle reading app data
ipcMain.handle('get-app-data', () => {
  const filePath = getDataPath();
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      return null;
    }
  }
  return null;
});

// Handle writing app data
ipcMain.handle('set-app-data', (event, data) => {
  const filePath = getDataPath();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return true;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 450,
    height: 600,
    alwaysOnTop: true,
    frame: false,
    resizable: false,
    maximizable: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  win.removeMenu();

     ipcMain.on("minimize", () => win.minimize());
  ipcMain.on("close", () => win.close());

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});