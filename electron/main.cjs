const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require("electron");
const fs = require("fs");
const path = require("path");

const WIDGET_URL = "https://decidelife.vercel.app/widget";
const MIN_WIDTH = 380;
const MIN_HEIGHT = 450;

const defaultSettings = {
  transparency: 0,
  keepOnTop: false,
  floatingMode: true,
  minimalMode: false,
  widgetSize: "medium",
  rememberPosition: true,
  hideScrollbars: true,
  launchOnStartup: false,
  bounds: null
};

let mainWindow = null;
let debugFrameEnabled = false;
let settings = { ...defaultSettings };

function settingsPath() {
  return path.join(app.getPath("userData"), "widget-settings.json");
}

function loadSettings() {
  try {
    settings = { ...defaultSettings, ...JSON.parse(fs.readFileSync(settingsPath(), "utf8")) };
  } catch {
    settings = { ...defaultSettings };
  }
}

function saveSettings() {
  fs.mkdirSync(app.getPath("userData"), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2));
}

function widthForSize(size) {
  if (size === "small") return 380;
  if (size === "large") return 480;
  return 420;
}

function applyWindowSettings() {
  if (!mainWindow) return;
  mainWindow.setAlwaysOnTop(Boolean(settings.keepOnTop));
  mainWindow.setSkipTaskbar(true);
  mainWindow.setResizable(false);
  app.setLoginItemSettings({
    openAtLogin: Boolean(settings.launchOnStartup),
    path: process.execPath
  });
}

function defaultBounds() {
  const workArea = screen.getPrimaryDisplay().workArea;
  const width = widthForSize(settings.widgetSize);
  return {
    width,
    height: 650,
    x: Math.round(workArea.x + (workArea.width - width) / 2),
    y: Math.round(workArea.y + (workArea.height - 650) / 2)
  };
}

function createWidgetWindow(boundsOverride) {
  const bounds = boundsOverride ?? (settings.rememberPosition && settings.bounds ? settings.bounds : defaultBounds());

  mainWindow = new BrowserWindow({
    width: Math.max(MIN_WIDTH, bounds.width ?? widthForSize(settings.widgetSize)),
    height: Math.max(MIN_HEIGHT, bounds.height ?? 650),
    x: bounds.x,
    y: bounds.y,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    frame: debugFrameEnabled,
    transparent: true,
    alwaysOnTop: Boolean(settings.keepOnTop),
    resizable: false,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    center: !boundsOverride && !(settings.rememberPosition && settings.bounds),
    title: "DecideLife Widget",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  applyWindowSettings();
  mainWindow.loadURL(WIDGET_URL);

  mainWindow.on("moved", () => {
    if (!settings.rememberPosition || !mainWindow) return;
    settings.bounds = mainWindow.getBounds();
    saveSettings();
  });

  mainWindow.on("close", () => {
    if (!settings.rememberPosition || !mainWindow) return;
    settings.bounds = mainWindow.getBounds();
    saveSettings();
  });
}

function toggleDebugFrame() {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  debugFrameEnabled = !debugFrameEnabled;
  mainWindow.destroy();
  createWidgetWindow(bounds);
}

ipcMain.handle("widget:get-settings", () => {
  return {
    transparency: settings.transparency,
    keepOnTop: settings.keepOnTop,
    floatingMode: settings.floatingMode,
    minimalMode: settings.minimalMode,
    widgetSize: settings.widgetSize,
    rememberPosition: settings.rememberPosition,
    hideScrollbars: settings.hideScrollbars,
    launchOnStartup: settings.launchOnStartup
  };
});

ipcMain.handle("widget:update-settings", (_event, partial) => {
  settings = { ...settings, ...partial };
  if (mainWindow && settings.rememberPosition) settings.bounds = mainWindow.getBounds();
  saveSettings();
  applyWindowSettings();
  if (mainWindow && partial.widgetSize) {
    const bounds = mainWindow.getBounds();
    mainWindow.setBounds({ ...bounds, width: widthForSize(settings.widgetSize) });
  }
  return {
    transparency: settings.transparency,
    keepOnTop: settings.keepOnTop,
    floatingMode: settings.floatingMode,
    minimalMode: settings.minimalMode,
    widgetSize: settings.widgetSize,
    rememberPosition: settings.rememberPosition,
    hideScrollbars: settings.hideScrollbars,
    launchOnStartup: settings.launchOnStartup
  };
});

ipcMain.on("widget:resize-to-content", (_event, size) => {
  if (!mainWindow || !size) return;
  const bounds = mainWindow.getBounds();
  const width = Math.max(MIN_WIDTH, Math.min(520, Number(size.width) || bounds.width));
  const height = Math.max(MIN_HEIGHT, Math.min(900, Number(size.height) || bounds.height));
  mainWindow.setBounds({ ...bounds, width, height });
  if (settings.rememberPosition) {
    settings.bounds = mainWindow.getBounds();
    saveSettings();
  }
});

app.whenReady().then(() => {
  loadSettings();
  createWidgetWindow();
  globalShortcut.register("F12", toggleDebugFrame);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWidgetWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
