const { getDailySalesData, getDailyInventoryData } = require('./reportFetch');
// 🚨 আপডেট: ফাইলের নামের বানান ঠিক করা হয়েছে (reportUI এর বদলে reportUi)
const { renderDailyReports, renderLaborReports } = require('./reportUi');

async function fetchDailyReports(targetDate = null) {
    try {
        const sales = await getDailySalesData(targetDate);
        const products = await getDailyInventoryData(targetDate); // 🆕 Products আনা হলো
        
        renderDailyReports(sales, products); // 🆕 সেলস কার্ড ও টেবিল আপডেট
        renderLaborReports(sales, products); // 🚨 আপডেট: খতিয়ানের টেবিলও আপডেট করা হলো
    } catch (err) {
        console.error("Report module execution failed:", err.message);
    }
}

function initReportFilters() {
    const checkExist = setInterval(() => {
        const btnFilter = document.getElementById('btn-filter-report');
        const btnReset = document.getElementById('btn-reset-report');
        const dateInput = document.getElementById('report-single-date');

        if (btnFilter && btnReset) {
            clearInterval(checkExist);

            btnFilter.replaceWith(btnFilter.cloneNode(true)); 
            const newBtnFilter = document.getElementById('btn-filter-report');

            newBtnFilter.addEventListener('click', async (e) => {
                e.preventDefault();
                const selectedDate = dateInput ? dateInput.value : null;

                newBtnFilter.innerText = "⏳ হিসাব আসছে...";
                newBtnFilter.disabled = true;

                await fetchDailyReports(selectedDate);

                newBtnFilter.innerHTML = "🔍 হিসাব দেখুন";
                newBtnFilter.disabled = false;
            });

            btnReset.replaceWith(btnReset.cloneNode(true));
            const newBtnReset = document.getElementById('btn-reset-report');

            newBtnReset.addEventListener('click', async (e) => {
                e.preventDefault();
                if (dateInput) dateInput.value = '';
                await fetchDailyReports(); 
            });
        }
    }, 100); 
}

document.addEventListener('click', async (e) => {
    const laborCard = e.target.closest('#btn-open-labor-ledger');
    if (laborCard) {
        e.preventDefault();
        const reportMainTableContainer = document.getElementById('report-main-table-container');
        const laborLedgerSubScreen = document.getElementById('labor-ledger-sub-screen');
        const dateInput = document.getElementById('report-single-date');
        
        if (reportMainTableContainer) reportMainTableContainer.classList.add('hidden');
        if (laborLedgerSubScreen) laborLedgerSubScreen.classList.remove('hidden');

        const selectedDate = dateInput ? dateInput.value : null;
        
        // ⚡ আপডেট: ডাটা আবার ফেচ করার দরকার নেই, আমরা সরাসরি খতিয়ান দেখাচ্ছি 
        // কারণ fetchDailyReports অলরেডি ডাটা ফেচ করে রেখেছে।
        const salesData = await getDailySalesData(selectedDate); 
        const productsData = await getDailyInventoryData(selectedDate); 
        renderLaborReports(salesData, productsData); 
        return;
    }

    const backBtn = e.target.closest('#btn-back-to-report');
    if (backBtn) {
        e.preventDefault();
        const reportMainTableContainer = document.getElementById('report-main-table-container');
        const laborLedgerSubScreen = document.getElementById('labor-ledger-sub-screen');
        
        if (laborLedgerSubScreen) laborLedgerSubScreen.classList.add('hidden');
        if (reportMainTableContainer) reportMainTableContainer.classList.remove('hidden');
        return;
    }
});

module.exports = { fetchDailyReports, initReportFilters };