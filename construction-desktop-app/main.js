const { app, BrowserWindow , ipcMain } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile(path.join(__dirname, 'src/index.html'));
    win.webContents.openDevTools(); // টেস্টিংয়ের জন্য কনসোল ওপেন থাকবে
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

//const { ipcMain, BrowserWindow } = require('electron');

// ফ্রন্টএন্ড (renderer.js) থেকে প্রিন্ট কমান্ড রিসিভ করা
ipcMain.on('print-invoice', (event, invoiceHTML) => {
    // একটি হিডেন উইন্ডো তৈরি করা (যা ইউজার দেখতে পাবে না)
    let workerWindow = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true } });
    
    // উইন্ডোতে ইনভয়েসের ডিজাইন লোড করা
    workerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(invoiceHTML)}`);

    workerWindow.webContents.on('did-finish-load', () => {
        // সরাসরি প্রিন্টারে পাঠানো (silent: false দিলে প্রিন্টার সিলেক্ট করার ডায়ালগ আসবে)
        workerWindow.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
            if (!success) console.log('Print failed:', failureReason);
            workerWindow.close(); // কাজ শেষে উইন্ডো বন্ধ
        });
    });
});