const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// تعطيل تسريع الأجهزة إذا لزم الأمر
// app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/favicon.jpg'),
    title: 'صندوق فتوى - مسجد الإيمان',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // إعدادات النافذة
    show: false,
    backgroundColor: '#f5f0e8',
    autoHideMenuBar: true
  });

  // إظهار النافذة عند الجاهزية
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // تحميل التطبيق
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // فتح الروابط الخارجية في المتصفح
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// عند جاهزية التطبيق
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// إغلاق التطبيق عند إغلاق جميع النوافذ (Windows/Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// معالجة الأخطاء
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
