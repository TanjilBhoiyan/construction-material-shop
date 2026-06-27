const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
            // পরবর্তীতে সিকিউরিটির জন্য আমরা এখানে আপনার তৈরি করা preload.js লিঙ্ক করব
        }
    });

    // 🔴 পরিবর্তন: main.js এখন src/main ফোল্ডারে, তাই index.html এর সঠিক পাথ দেওয়া হলো
    win.loadFile(path.join(__dirname, '../renderer/pages/index.html')); 
    
    win.webContents.openDevTools(); 
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ফ্রন্টএন্ড থেকে প্রিন্ট কমান্ড রিসিভ করা
ipcMain.on('print-invoice', (event, invoiceHTML) => {
    let workerWindow = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true } });
    
    workerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(invoiceHTML)}`);

    workerWindow.webContents.on('did-finish-load', () => {
        workerWindow.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
            if (!success) console.log('Print failed:', failureReason);
            workerWindow.close(); 
        });
    });
});