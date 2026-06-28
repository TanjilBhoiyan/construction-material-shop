// ========================================================
// 🏢 নেক্সট-লেভেল মডিউলার আর্কিটেকচার ইমপোর্টার্স (১০০% কমপ্লিট)
// ========================================================
const fs = require('fs');
const path = require('path');
const { initLaborSettingsModule } = require('./modules/settings/laborSettings');

const { supabase, checkConnection } = require('./config/supabaseClient');
const { fetchProducts, initProductForm } = require('./modules/inventory/index');
const { initBillingModule, populateBillingDropdown } = require('./modules/billing/index'); 
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
        inventory: 'ui-components/inventory.html',
        billing: 'ui-components/billing.html',
        reports: 'ui-components/reports.html',
        customers: 'ui-components/customers.html',
        settings: 'modules/settings/laborSettings.html' // 🎯 সেটিংস মডিউলকেও ক্যাশিং ইঞ্জিনে যোগ করা হলো
    };

    const container = document.getElementById('app-container');
    if (!container) return;
    
    container.innerHTML = ''; // লোডিং স্পিনার বা আগের কন্টেন্ট ক্লিয়ার করা

    Object.keys(modules).forEach(key => {
        try {
            const filePath = path.join(__dirname, modules[key]);
            const htmlContent = fs.readFileSync(filePath, 'utf8');
            
            const viewDiv = document.createElement('div');
            viewDiv.id = `${key}-screen`; 
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
    const menuSettingsBtn = document.getElementById('menu-settings'); // 🎯 সেটিংস বাটন যুক্ত হলো

    // ডিফল্ট আন-অ্যাক্টিভ স্টাইল (আপনার আগের ক্লাসের সাথে মিল রেখে)
    const inactiveClass = "hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200 transition";
    
    if (tabInventoryBtn) tabInventoryBtn.className = inactiveClass;
    if (tabBillingBtn) tabBillingBtn.className = inactiveClass;
    if (tabReportBtn) tabReportBtn.className = inactiveClass;
    if (tabCustomerBtn) tabCustomerBtn.className = inactiveClass;
    if (menuSettingsBtn) menuSettingsBtn.className = inactiveClass; // সেটিংস বাটন স্টাইল ক্লিয়ার

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
    const menuSettingsBtn = document.getElementById('menu-settings'); // 🎯 সেটিংস বাটন

    const activeClass = "bg-blue-700 px-4 py-2 rounded font-semibold text-white shadow";

    if (tabInventoryBtn) {
        tabInventoryBtn.addEventListener('click', () => {
            resetTabStyles();
            if (cachedModules['inventory']) cachedModules['inventory'].classList.remove('hidden');
            tabInventoryBtn.className = activeClass;
            fetchProducts();
        });
    }

    if (tabBillingBtn) {
        tabBillingBtn.addEventListener('click', () => {
            resetTabStyles();
            if (cachedModules['billing']) cachedModules['billing'].classList.remove('hidden');
            tabBillingBtn.className = activeClass;
            if (typeof window.populateBillingDropdown === 'function') {
                window.populateBillingDropdown();
            }
        });
    }

    if (tabReportBtn) {
        tabReportBtn.addEventListener('click', () => {
            resetTabStyles();
            if (cachedModules['reports']) cachedModules['reports'].classList.remove('hidden');
            tabReportBtn.className = activeClass;
            fetchDailyReports(); 
        });
    }

    if (tabCustomerBtn) {
        tabCustomerBtn.addEventListener('click', () => {
            resetTabStyles();
            if (cachedModules['customers']) cachedModules['customers'].classList.remove('hidden');
            tabCustomerBtn.className = activeClass;
            fetchCustomers(); 
        });
    }

    // 🎯 সেটিংস বাটনে ক্লিক করলে আপনার এক্সিস্টিং ক্যাশ আর্কিটেকচার অনুযায়ী ভিউ শো হবে
    if (menuSettingsBtn) {
        menuSettingsBtn.addEventListener('click', () => {
            resetTabStyles();
            if (cachedModules['settings']) {
                cachedModules['settings'].classList.remove('hidden'); // সেটিংস স্ক্রিন আনহাইড
            }
            menuSettingsBtn.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white shadow"; // অ্যাক্টিভ কালার
            
            // ডাটাবেজ থেকে লেটেস্ট রেট লোড করা
            initLaborSettingsModule(); 
        });
    }
}

// ==========================================================
// 🚀 ৩. লাইফসাইকেল... (সব জোড়া লাগানোর মেইন গেইট)
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    // ক) প্রথমে ৫টি মডিউলের এইচটিএমএল ফাইল ইনজেক্ট করা হলো (সেটিংস সহ)
    preloadHTMLModules();

    // খ) এইচটিএমএল আসার পর নেভিগেশন ক্লিক ইভেন্ট বাইন্ড করা হলো
    initNavigationEvents();

    // গ) ডাটাবেজ কানেকশন চেক
    checkConnection();

    // ঘ) আপনার মডিউলের কোর ফাংশনগুলো এখন সেফলি ইনিশিয়েট হবে
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

    // const addressInput = document.getElementById('customer-address');
    // if (addressInput) {
    //     addressInput.addEventListener('click', function() {
    //         // এটি ক্লিক করার সাথে সাথে সাজেশন লিস্ট খুলতে সাহায্য করবে
    //         this.blur();
    //         this.focus();
    //     });
    // }

    console.log("🚀 সেটিংস সহ সব মডিউল এবং লজিক সফলভাবে ক্যাশ ও লোড হয়েছে।");
});