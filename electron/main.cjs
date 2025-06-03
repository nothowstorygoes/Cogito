const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require("electron-updater");
const { dialog } = require('electron');
const path = require('path');
const { shell } = require('electron');
const fs = require('fs');


// --- Retrocompatibilità: migrazione dati da vecchia cartella ---
const oldUserData = app.getPath('userData');
const newUserData = path.join(app.getPath('appData'), 'Ergo', 'Cogito');

// Funzione ricorsiva per spostare tutti i file e cartelle
function moveDirContents(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.lstatSync(srcPath).isDirectory()) {
      moveDirContents(srcPath, destPath);
      fs.rmdirSync(srcPath);
    } else {
      fs.renameSync(srcPath, destPath);
    }
  }
}

// Se la vecchia cartella esiste e la nuova no, migra tutto
if (fs.existsSync(oldUserData) && !fs.existsSync(newUserData)) {
  try {
    moveDirContents(oldUserData, newUserData);
    fs.rmdirSync(oldUserData, { recursive: true });
    console.log(`[Migration] Moved data from ${oldUserData} to ${newUserData}`);
  } catch (err) {
    console.error('[Migration] Error moving data:', err);
  }
}

// Forza sempre il nuovo path per userData
app.setPath('userData', newUserData);


// Integrazione Ergo

function examShelfOnboardingExists() {
  const examShelfPath = path.join(app.getPath('appData'), 'Ergo', 'ExamShelf', 'onboarding.json');
  return fs.existsSync(examShelfPath);
}

ipcMain.handle("exam-shelf-onboarding-exists", () => {
  return examShelfOnboardingExists();
});

ipcMain.handle("ergo-integration", async () => {
  try {
    // Path di origine e destinazione
    const examPath = path.join(app.getPath('appData'), 'Ergo', 'ExamShelf', 'exams.json');
    const integrationPath = path.join(app.getPath('appData'), 'Ergo', 'Cogito', 'ExamIntegration.json');

    // Leggi exam.json
    if (!fs.existsSync(examPath)) {
      throw new Error("exam.json not found in Ergo/ExamShelf");
    }
    const data = fs.readFileSync(examPath, "utf-8");
    const array = JSON.parse(data);

    // Scrivi ExamIntegration.json
    fs.writeFileSync(integrationPath, JSON.stringify(array, null, 2), "utf-8");

    return { success: true };
  } catch (err) {
    console.error("[Ergo Integration] Error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("check-exam-integration", () => {
  const integrationPath = path.join(app.getPath('appData'), 'Ergo', 'Cogito', 'ExamIntegration.json');
  return fs.existsSync(integrationPath);
});

ipcMain.handle("delete-exam-integration", () => {
  const integrationPath = path.join(app.getPath('appData'), 'Ergo', 'Cogito', 'ExamIntegration.json');
  if (fs.existsSync(integrationPath)) {
    fs.unlinkSync(integrationPath);
    return true;
  }
  return false;
});

ipcMain.handle("get-exam-integration-list", () => {
  const integrationPath = path.join(app.getPath('appData'), 'Ergo', 'Cogito', 'ExamIntegration.json');
  if (fs.existsSync(integrationPath)) {
    try {
      const data = fs.readFileSync(integrationPath, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
});

// Debug all'inizio
console.log('[Main] Starting Electron app...');
console.log('[Main] __dirname:', __dirname);
console.log('[Main] app.isPackaged:', app.isPackaged);

// --- Utility Functions ---
function getOnboardingPath() {
  return path.join(app.getPath('userData'), 'onboarding.json');
}
function getLoggerPath() {
  return path.join(app.getPath('userData'), 'logger.json');
}
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return true;
}
function readJson(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
      console.error('Error reading JSON file:', error);
      return null;
    }
  }
  return null;
}

// --- IPC Handlers for Data ---
ipcMain.handle('get-onboarding-data', () => readJson(getOnboardingPath()));
ipcMain.handle('set-onboarding-data', (event, data) => writeJson(getOnboardingPath(), data));
ipcMain.handle('get-logger-data', () => readJson(getLoggerPath()));
ipcMain.handle('set-logger-data', (event, dataArr) => {
  const filePath = getLoggerPath();
  writeJson(filePath, dataArr);
  return true;
});

// --- Window Management ---
let mainWindow = null;

function createWindow(route = "/today") {
  console.log('[Main] Creating window with route:', route);

  mainWindow = new BrowserWindow({
    width: 450,
    height: 600,
    frame: false,
    resizable: true,
    maximizable: false,
    alwaysOnTop: false,
    show: false, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), 
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  console.log('[Main] Window created');
  mainWindow.removeMenu();

  if (!app.isPackaged) {
    // Modalità sviluppo
    console.log('[Main] Development mode - loading from localhost');
    const url = `http://localhost:5173${route}`;
    console.log('[Main] Loading URL:', url);
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools();
  } else {
    // Modalità production - CORRETTO
    console.log('[Main] Production mode - loading from file');

    // Il percorso corretto per i file buildati
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('[Main] Index path:', indexPath);
    console.log('[Main] File exists:', fs.existsSync(indexPath));

    if (fs.existsSync(indexPath)) {
      const stats = fs.statSync(indexPath);
      console.log('[Main] File size:', stats.size, 'bytes');

      // Carica il file HTML principale
      mainWindow.loadFile(indexPath).then(() => {
        console.log('[Main] File loaded successfully');

        // Dopo che la pagina è caricata, naviga alla route se necessario
        mainWindow.webContents.once('did-finish-load', () => {
          console.log('[Main] Page finished loading, navigating to route:', route);
          if (route !== '/' && route !== '/today') {
            // Usa il router di React per navigare
            mainWindow.webContents.executeJavaScript(`
              if (window.navigateToRoute) {
                window.navigateToRoute('${route}');
              } else {
                console.warn('navigateToRoute not available yet');
              }
            `);
          }
        });
      }).catch((error) => {
        console.error('[Main] Error loading file:', error);
      });
    } else {
      console.error('[Main] Index file not found at:', indexPath);

      // Prova percorsi alternativi
      const altPaths = [
        path.join(__dirname, 'dist/index.html'),
        path.join(__dirname, '../../dist/index.html'),
        path.join(process.resourcesPath, 'dist/index.html')
      ];

      for (const altPath of altPaths) {
        console.log('[Main] Trying alternative path:', altPath);
        if (fs.existsSync(altPath)) {
          console.log('[Main] Found at alternative path!');
          mainWindow.loadFile(altPath);
          break;
        }
      }
    }
  }

  // Eventi di debug
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('[Main] Page finished loading');
    mainWindow.show(); // Mostra la finestra quando è pronta
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error('[Main] Failed to load:', {
      errorCode,
      errorDescription,
      validatedURL,
      isMainFrame
    });
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('[Renderer Console]', message);
  });

  // Prevent manual resizing by user while allowing programmatic resize
  mainWindow.on('will-resize', (event) => {
    event.preventDefault();
  });

  mainWindow.on('closed', () => {
    console.log('[Main] Window closed');
    mainWindow = null;
  });

  mainWindow.on('ready-to-show', () => {
    console.log('[Main] Window ready to show');
    mainWindow.show();
  });
}

// --- Utility IPC for All Windows ---
ipcMain.on("minimize", () => {
  console.log('[Main] Minimize requested');
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});
ipcMain.on("close", () => {
  console.log('[Main] Close requested');
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});
ipcMain.on("reload", () => {
  console.log('[Main] Reload requested');
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
});
ipcMain.on('renderer-log', (event, ...args) => {
  console.log('[Renderer]', ...args);
});

ipcMain.on('resize-for-session', () => {
    console.log('[Main] Resizing for session');
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setSize(200, 200, true);
        mainWindow.setAlwaysOnTop(true);
    }
});

ipcMain.handle("open-external", (event, url) => {
  shell.openExternal(url);
});


ipcMain.on('close-session', () => {
    console.log('[Main] close-session received');

    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setSize(450, 600, true);
        mainWindow.center();
        mainWindow.setAlwaysOnTop(false);
    }
});

ipcMain.on('navigate', (event, route) => {
  console.log('[Main] navigate event received:', route);
  resizeAndNavigate(route);
});

let pendingSessionResult = null;

ipcMain.on('session-result', (event, result) => {
  console.log('[Main] session-result event received:', result);
  pendingSessionResult = result;
});

ipcMain.on('renderer-ready', () => {
  console.log('[Main] renderer-ready received, pendingSessionResult:', pendingSessionResult);
  if (pendingSessionResult && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('session-result', pendingSessionResult);
    pendingSessionResult = null;
  }
});

ipcMain.handle("show-save-dialog", async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result.canceled ? null : result.filePath;
});

ipcMain.handle("save-file", async (event, { filePath, content }) => {
  fs.writeFileSync(filePath, content, "utf-8");
  return true;
});

autoUpdater.on('update-available', () => {
  console.log('[AutoUpdater] Update available');
});

let updateDownloaded = false;
let installOnQuit = false;

// Quando l'update è scaricato, avvisa il renderer
autoUpdater.on('update-downloaded', () => {
  console.log('[AutoUpdater] Update downloaded, waiting for user action');
  updateDownloaded = true;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-downloaded');
  }
});

// Ricevi la scelta dell'utente dal renderer
ipcMain.on('user-update-action', (event, action) => {
  if (action === 'install-now') {
    console.log('[AutoUpdater] User chose to install now');
    autoUpdater.quitAndInstall();
  } else if (action === 'install-on-quit') {
    console.log('[AutoUpdater] User chose to install on quit');
    installOnQuit = true;
  }
});

// Quando l'app sta per chiudersi, installa se richiesto
app.on('before-quit', (event) => {
  if (updateDownloaded && installOnQuit) {
    console.log('[AutoUpdater] Installing update on quit');
    autoUpdater.quitAndInstall();
  }
});


autoUpdater.on('error', (err) => {
  console.error('[AutoUpdater] Error:', err);
});

// --- App Lifecycle ---
console.log('[Main] Setting up app lifecycle events');

app.whenReady().then(() => {
  console.log('[Main] App is ready, creating window');
  createWindow("/");
    // Avvia la ricerca di aggiornamenti
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
  console.log('[Main] All windows closed');
  if (process.platform !== 'darwin') {
    console.log('[Main] Quitting app');
    app.quit();
  }
});

app.on('activate', () => {
  console.log('[Main] App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow("/");
  }
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// Gestione errori globali
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('[Main] main.cjs loaded completely');