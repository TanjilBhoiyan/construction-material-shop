const Router = require('../js/router.js');
const { testDbConnection } = require('../../shared/config/supabaseClient.js');
// const { InventoryUI } = require('../js/modules/inventory.ui.js');
// const { BillingUI } = require('../js/modules/billing.ui.js');
// const { CustomerUI } = require('../js/modules/customers.ui.js');
// const { ReportsUI } = require('../js/modules/reports.ui.js');

document.addEventListener('DOMContentLoaded', async () => {
    // ১. অ্যাপের রাউটার চালু করা
    Router.init(); 
    Router.loadScreen('inventory'); 

    // ২. ডাটাবেজ কানেকশন চেক করে UI আপডেট করা
    const dbStatus = document.getElementById('db-status');
    if (dbStatus) {
        dbStatus.innerText = "Connecting..."; // শুরুতে লোডিং দেখাবে
        
        const isConnected = await testDbConnection();
        console.log("Database status is:", isConnected);
        if (isConnected) {
            dbStatus.innerText = "● Cloud DB Connected";
            dbStatus.className = "text-sm bg-green-500 text-white px-3 py-1 rounded-full font-semibold";
        } else {
            dbStatus.innerText = "● Connection Failed!";
            dbStatus.className = "text-sm bg-red-500 text-white px-3 py-1 rounded-full font-semibold";
        }
    }
});