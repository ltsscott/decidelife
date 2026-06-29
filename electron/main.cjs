const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require("electron");
const { spawn } = require("child_process");
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
  pinToDesktop: false,
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
  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: Boolean(settings.launchOnStartup),
      path: process.execPath
    });
  } else {
    app.setLoginItemSettings({ openAtLogin: false });
  }
  if (settings.pinToDesktop) pinWindowToDesktop();
}

function nativeHandleDecimal() {
  if (!mainWindow) return "0";
  const handle = mainWindow.getNativeWindowHandle();
  if (handle.length >= 8) return handle.readBigUInt64LE(0).toString();
  return BigInt(handle.readUInt32LE(0)).toString();
}

function pinWindowToDesktop() {
  if (process.platform !== "win32" || !mainWindow) return;
  const hwnd = nativeHandleDecimal();
  const script = `
$signature = @"
using System;
using System.Runtime.InteropServices;
public static class Win32 {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
  [DllImport("user32.dll")] public static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);
  [DllImport("user32.dll")] public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] public static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);
}
"@
Add-Type $signature -ErrorAction SilentlyContinue
$progman = [Win32]::FindWindow("Progman", $null)
$result = [IntPtr]::Zero
[Win32]::SendMessageTimeout($progman, 0x052C, [IntPtr]::Zero, [IntPtr]::Zero, 0, 1000, [ref]$result) | Out-Null
$workerw = [IntPtr]::Zero
[Win32]::EnumWindows({
  param([IntPtr]$tophandle, [IntPtr]$topptr)
  $shellView = [Win32]::FindWindowEx($tophandle, [IntPtr]::Zero, "SHELLDLL_DefView", $null)
  if ($shellView -ne [IntPtr]::Zero) {
    $script:workerw = [Win32]::FindWindowEx([IntPtr]::Zero, $tophandle, "WorkerW", $null)
  }
  return $true
}, [IntPtr]::Zero) | Out-Null
if ($workerw -eq [IntPtr]::Zero) { $workerw = $progman }
[Win32]::SetParent([IntPtr]${hwnd}, $workerw) | Out-Null
`;

  const child = spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
    windowsHide: true,
    stdio: "ignore"
  });
  child.on("error", (error) => {
    console.warn("[DecideLife widget] Pin to Desktop failed.", error);
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
    pinToDesktop: settings.pinToDesktop,
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
  if (mainWindow && Object.prototype.hasOwnProperty.call(partial, "pinToDesktop") && !settings.pinToDesktop) {
    const bounds = mainWindow.getBounds();
    mainWindow.destroy();
    createWidgetWindow(bounds);
  }
  return {
    transparency: settings.transparency,
    keepOnTop: settings.keepOnTop,
    floatingMode: settings.floatingMode,
    minimalMode: settings.minimalMode,
    pinToDesktop: settings.pinToDesktop,
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
