// ========================================================
// 🏢 নেক্সট-লেভেল মডিউলার আর্কিটেকচার ইমপোর্টার্স (১০০% কমপ্লিট)
// ========================================================
const fs = require('fs');
const path = require('path');

const { supabase, checkConnection } = require('./config/supabaseClient');
const { fetchProducts, initProductForm } = require('./modules/inventory/index');
const { initBillingModule, populateBillingDropdown } = require('./modules/billing/index'); 
//const { fetchDailyReports } = require('./modules/reports/index');
const { fetchDailyReports, initReportFilters } = require('./modules/reports/index');
const { fetchCustomers, initCustomerModule } = require('./modules/customers/index');

window.supabase = supabase; 

// যখন অ্যাপ চালু হবে বা রিপোর্ট ট্যাব ক্লিক হবে:
fetchDailyReports();    // আজকের ডাটা লোড করবে
initReportFilters();   // ফিল্টার বাটনের ক্লিক লজিক চালু করবে
// অ্যাপের গ্লোবাল ফাংশনগুলোর বাইন্ডিং (ট্যাব স্যুইচিংয়ের সুবিধার জন্য)
window.fetchProducts = fetchProducts;
window.fetchDailyReports = fetchDailyReports;
window.fetchCustomers = fetchCustomers;
window.populateBillingDropdown = populateBillingDropdown; 

// 💾 মেমরিতে HTML মডিউলগুলো ক্যাশ রাখার অবজেক্ট
const cachedModules = {};

// ==========================================================
// 📥 ১. HTML মডিউলগুলো ডমে (DOM) বুটস্ট্র্যাপ করার ইঞ্জিন
// ==========================================================
function preloadHTMLModules() {
    const modules = {
        inventory: 'inventory.html',
        billing: 'billing.html',
        reports: 'reports.html',
        customers: 'customers.html'
    };

    const container = document.getElementById('app-container');
    if (!container) return;
    
    container.innerHTML = ''; // লোডিং স্পিনার ক্লিয়ার করা

    Object.keys(modules).forEach(key => {
        try {
            const filePath = path.join(__dirname, 'ui-components', modules[key]);
            const htmlContent = fs.readFileSync(filePath, 'utf8');
            
            const viewDiv = document.createElement('div');
            viewDiv.id = `${key}-screen`; // আপনার আগের আইডির সাথে মিল রাখা হলো
            viewDiv.className = 'module-view hidden'; // শুরুতে সব হাইড
            viewDiv.innerHTML = htmlContent;
            
            container.appendChild(viewDiv);
            cachedModules[key] = viewDiv;
        } catch (err) {
            console.error(`Error loading html module [${key}]:`, err.message);
        }
    });
}

// ==========================================================
// 🛠️ ২. আপনার এক্সিস্টিং ট্যাব স্যুইচিং এবং নেভিগেশন লজিক কোড
// ==========================================================
function resetTabStyles() {
    const tabInventoryBtn = document.getElementById('tab-inventory-btn');
    const tabBillingBtn = document.getElementById('tab-billing-btn');
    const tabReportBtn = document.getElementById('tab-report-btn');
    const tabCustomerBtn = document.getElementById('tab-customer-btn');

    if (tabInventoryBtn) tabInventoryBtn.className = "hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200 transition";
    if (tabBillingBtn) tabBillingBtn.className = "hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200 transition";
    if (tabReportBtn) tabReportBtn.className = "hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200 transition";
    if (tabCustomerBtn) tabCustomerBtn.className = "hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200 transition";

    // সব মডিউল ভিউ একবারে হাইড করা
    document.querySelectorAll('.module-view').forEach(view => {
        view.classList.add('hidden');
    });
}

function initNavigationEvents() {
    const tabInventoryBtn = document.getElementById('tab-inventory-btn');
    const tabBillingBtn = document.getElementById('tab-billing-btn');
    const tabReportBtn = document.getElementById('tab-report-btn');
    const tabCustomerBtn = document.getElementById('tab-customer-btn');

    if (tabInventoryBtn) {
        tabInventoryBtn.addEventListener('click', () => {
            resetTabStyles();
            if (cachedModules['inventory']) cachedModules['inventory'].classList.remove('hidden');
            tabInventoryBtn.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white shadow";
            fetchProducts();
        });
    }

    if (tabBillingBtn) {
        tabBillingBtn.addEventListener('click', () => {
            resetTabStyles();
            if (cachedModules['billing']) cachedModules['billing'].classList.remove('hidden');
            tabBillingBtn.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white shadow";
            if (typeof window.populateBillingDropdown === 'function') {
                window.populateBillingDropdown();
            }
        });
    }

    if (tabReportBtn) {
        tabReportBtn.addEventListener('click', () => {
            resetTabStyles();
            if (cachedModules['reports']) cachedModules['reports'].classList.remove('hidden');
            tabReportBtn.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white shadow";
            fetchDailyReports(); 
        });
    }

    if (tabCustomerBtn) {
        tabCustomerBtn.addEventListener('click', () => {
            resetTabStyles();
            if (cachedModules['customers']) cachedModules['customers'].classList.remove('hidden');
            tabCustomerBtn.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white shadow";
            fetchCustomers(); 
        });
    }
}

// ==========================================================
// 🚀 ৩. লাইফসাইকেল কন্ট্রোলার (সব জোড়া লাগানোর মেইন গেইট)
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    // ক) প্রথমে ৪টি মডিউলের এইচটিএমএল ফাইল ইনজেক্ট করা হলো
    preloadHTMLModules();

    // খ) এইচটিএমএল আসার পর নেভিগেশন ক্লিক ইভেন্ট বাইন্ড করা হলো
    initNavigationEvents();

    // গ) ডাটাবেজ কানেকশন চেক
    checkConnection();

    // ঘ) আপনার মডিউলের কোর ফাংশনগুলো এখন সেফলি ইনিশিয়েট হবে (কোনো আইডি ক্র্যাশ করবে না)
    fetchProducts();      // স্টক লিস্ট লোড হবে
    initProductForm();    // ফর্ম সাবমিট হ্যান্ডলার এক্টিভ হবে
    initBillingModule();  // বিলিং মডিউল লজিক রেডি হবে
    initCustomerModule(); // কাস্টমার খতিয়ান মডিউল এক্টিভ হবে

    // ঙ) প্রথমবার ডিফল্ট ভিউ সেটআপ (ইনভেন্টরি স্ক্রিন ওপেন হবে)
    const defaultTab = document.getElementById('tab-inventory-btn');
    if (defaultTab && cachedModules['inventory']) {
        cachedModules['inventory'].classList.remove('hidden');
        defaultTab.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white shadow";
    }

    console.log("🚀 সব মডিউল এবং লজিক সফলভাবে লোড হয়েছে।");
});