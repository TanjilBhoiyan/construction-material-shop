// ========================================================
// 🏢 নেক্সট-লেভেল মডিউলার আর্কিটেকচার ইমপোর্টার্স (১০০% কমপ্লিট)
// ========================================================
const { supabase, checkConnection } = require('./config/supabaseClient');
const { fetchProducts, initProductForm } = require('./modules/inventory');
const { initBillingModule } = require('./modules/billing'); 
const { fetchDailyReports } = require('./modules/reports'); 
const { fetchCustomers, initCustomerModule } = require('./modules/customers'); 

window.supabase = supabase; 

// অ্যাপের গ্লোবাল ফাংশনগুলোর বাইন্ডিং (ট্যাব স্যুইচিংয়ের সুবিধার জন্য)
window.fetchProducts = fetchProducts;
window.fetchDailyReports = fetchDailyReports;
window.fetchCustomers = fetchCustomers;

// অ্যাপ চালু হওয়ার সাথে সাথে কানেকশন ও মডিউলগুলো ইনিশিয়েট হবে
checkConnection();
fetchProducts();      // 👈 এটি রান হয়ে স্টক লিস্ট লোড করবে
initProductForm();    // 👈 এটি ফর্মের সাবমিট ও ড্রপডাউন হ্যান্ডেল করবে
initBillingModule(); 
initCustomerModule();

// ==========================================
// 🛠️ ট্যাব স্যুইচিং এবং নেভিগেশন লজিক কোড
// ==========================================

const tabInventoryBtn = document.getElementById('tab-inventory-btn');
const tabBillingBtn = document.getElementById('tab-billing-btn');
const tabReportBtn = document.getElementById('tab-report-btn');
const tabCustomerBtn = document.getElementById('tab-customer-btn');

const inventoryScreen = document.getElementById('inventory-screen');
const billingScreen = document.getElementById('billing-screen');
const reportScreen = document.getElementById('report-screen');
const customerScreen = document.getElementById('customer-screen');

function resetTabStyles() {
    if (tabInventoryBtn) tabInventoryBtn.className = "hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200";
    if (tabBillingBtn) tabBillingBtn.className = "hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200";
    if (tabReportBtn) tabReportBtn.className = "hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200";
    if (tabCustomerBtn) tabCustomerBtn.className = "hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200";

    if (inventoryScreen) inventoryScreen.classList.add('hidden');
    if (billingScreen) billingScreen.classList.add('hidden');
    if (reportScreen) reportScreen.classList.add('hidden');
    if (customerScreen) customerScreen.classList.add('hidden');
}

if (tabInventoryBtn) {
    tabInventoryBtn.addEventListener('click', () => {
        resetTabStyles();
        inventoryScreen.classList.remove('hidden');
        tabInventoryBtn.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white";
        fetchProducts();
    });
}

if (tabBillingBtn) {
    tabBillingBtn.addEventListener('click', () => {
        resetTabStyles();
        billingScreen.classList.remove('hidden');
        tabBillingBtn.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white";
        if (typeof window.populateProductDropdown === 'function') {
            window.populateProductDropdown();
        }
    });
}

if (tabReportBtn) {
    tabReportBtn.addEventListener('click', () => {
        resetTabStyles();
        reportScreen.classList.remove('hidden');
        tabReportBtn.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white";
        fetchDailyReports(); 
    });
}

if (tabCustomerBtn) {
    tabCustomerBtn.addEventListener('click', () => {
        resetTabStyles();
        customerScreen.classList.remove('hidden');
        tabCustomerBtn.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white";
        fetchCustomers(); 
    });
}