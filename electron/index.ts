// Native
import { join } from 'path';
import fs from 'fs';

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent, nativeTheme, dialog, MenuItemConstructorOptions, Menu } from 'electron';
import isDev from 'electron-is-dev';

import * as osc from './osc';
let oscSender = osc.getOscSender();

const height = 800;
const width = 800;

console.log('isDev:', isDev);

// let mainWindow: BrowserWindow | null = null;
let viewport3dWindow: BrowserWindow | null = null;

function createMainWindow() {
  // Create the browser window.
  const window = new BrowserWindow({
    width,
    height,
    //  change to false to use AppBar
    frame: false,
    title: 'VRChat Camera Dolly Editor',
    // titleBarStyle: 'hidden',
    show: true,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    }
  });

  const port = process.env.PORT || 3000;
  const url = isDev ? `http://localhost:${port}` : join(__dirname, '../dist-vite/index.html');

  // and load the index.html of the app.
  if (isDev) {
    window?.loadURL(url);
  } else {
    window?.loadFile(url);
  }
  // Open the DevTools.
  // window.webContents.openDevTools();

  // For AppBar
  ipcMain.on('minimize', () => {
    // eslint-disable-next-line no-unused-expressions
    window.isMinimized() ? window.restore() : window.minimize();
    // or alternatively: win.isVisible() ? win.hide() : win.show()
  });
  ipcMain.on('maximize', () => {
    // eslint-disable-next-line no-unused-expressions
    window.isMaximized() ? window.restore() : window.maximize();
  });

  ipcMain.on('close', () => {
    window.close();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  nativeTheme.themeSource = 'dark';
  // mainWindow = window;
}

function create3DViewportWindow () {
  const window = new BrowserWindow({
    width: 800,
    height: 800,
    title: '3D Viewport',
    show: true,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, 'preload_viewport.js')
    },
    autoHideMenuBar: true,
  });

  const port = process.env.PORT || 3000;
  const url = isDev ? `http://localhost:${port}/viewport.html` : join(__dirname, '../dist-vite/viewport.html');

  // and load the index.html of the app.
  if (isDev) {
    window?.loadURL(url);
  } else {
    window?.loadFile(url);
  }
  // Open the DevTools.
  // window.webContents.openDevTools();

  window.on('closed', () => {
    viewport3dWindow = null;
  });

  viewport3dWindow = window;
}

ipcMain.handle("3d:open-viewport-window", () => {
  if (!viewport3dWindow) { create3DViewportWindow(); }
  else { viewport3dWindow.focus(); }
  return (viewport3dWindow !== null);
});


function createMenu() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            // Open file dialog
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            // Save file dialog
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createMainWindow();
  createMenu();
 
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on('message', (event: IpcMainEvent, message: any) => {
  console.log(message);
  setTimeout(() => event.sender.send('message', 'common.hiElectron'), 500);
});

// #region IPC Handlers
// listen the channel `open-file` and show the open file dialog
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (canceled) {
    return { canceled: true, content: '', filePath: '' };
  } else {
    const filePath = filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    return { canceled: false, content, filePath };
  }
});

ipcMain.handle('dialog:saveFile', async (_, data, currentFilePath) => {
  let filePath = currentFilePath;
  if (!filePath) {
    const { canceled, filePath: newFilePath } = await dialog.showSaveDialog({
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (canceled) {
      return { canceled: true, filePath: '' };
    } else {
      filePath = newFilePath;
    }
  }
  fs.writeFileSync(filePath, data, 'utf-8');
  return { canceled: false, filePath };
});

ipcMain.handle('osc:getSender', async () => {
  return oscSender;
});

ipcMain.handle('osc:dollyPlay', async () => {
  osc.dollyPlay(oscSender);
});

ipcMain.handle('osc:dollyPlayDelayed', async (_, delay: number) => {
  osc.dollyPlayDelayed(oscSender, delay);
});

ipcMain.handle('osc:exportPaths', async (_) => {
  osc.exportPaths(oscSender);
});

ipcMain.handle('osc:importPaths', async (_, json: string) => {
  osc.importPaths(oscSender, json);
});

ipcMain.handle('osc:chatbox', async (_, message: string) => {
  osc.chatbox(oscSender, message);
});

ipcMain.handle('3d:does-viewport-window-exist', () => {
  return (viewport3dWindow !== null);
});

ipcMain.handle('3d:send-paths', (_, paths) => {
  if (!viewport3dWindow) { return; }
  viewport3dWindow?.webContents.send('3d:receive-paths', paths);
});

// #endregion