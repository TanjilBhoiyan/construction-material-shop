const { getDailySalesData } = require('./reportFetch');
const { renderDailyReports } = require('./reportUI');

async function fetchDailyReports(targetDate = null) {
    try {
        const sales = await getDailySalesData(targetDate);
        renderDailyReports(sales);
    } catch (err) {
        console.error("Report module execution failed:", err.message);
    }
}

function initReportFilters() {
    // পুরানো কোনো ইভেন্ট লিসেনার থাকলে ক্ল্যাশ এড়াতে এই ট্রিক
    const checkExist = setInterval(() => {
        const btnFilter = document.getElementById('btn-filter-report');
        const btnReset = document.getElementById('btn-reset-report');
        const dateInput = document.getElementById('report-single-date');

        if (btnFilter && btnReset) {
            clearInterval(checkExist); // বাটন পাওয়া গেছে, লুপ বন্ধ

            // 🔍 'হিসাব দেখুন' বাটনের জন্য একদম ফ্রেশ ইভেন্ট লিসেনার ফিক্স
            btnFilter.replaceWith(btnFilter.cloneNode(true)); 
            const newBtnFilter = document.getElementById('btn-filter-report');

            newBtnFilter.addEventListener('click', async (e) => {
                e.preventDefault();
                const selectedDate = dateInput ? dateInput.value : null;

                // if (!selectedDate) {
                //     alert("ভাই, দয়া করে আগে একটি তারিখ সিলেক্ট করুন।");
                //     return;
                // }

                newBtnFilter.innerText = "⏳ হিসাব আসছে...";
                newBtnFilter.disabled = true;

                // সরাসরি সিলেক্টেড ডেট পাস করা হলো
                await fetchDailyReports(selectedDate);

                newBtnFilter.innerHTML = "🔍 হিসাব দেখুন";
                newBtnFilter.disabled = false;
            });

            // 🔄 'আজকের দিন' বাটনের জন্য ফ্রেশ ইভেন্ট লিসেনার ফিক্স
            btnReset.replaceWith(btnReset.cloneNode(true));
            const newBtnReset = document.getElementById('btn-reset-report');

            newBtnReset.addEventListener('click', async (e) => {
                e.preventDefault();
                if (dateInput) dateInput.value = '';
                await fetchDailyReports(); // রিসেট দিলে আজকের দিনের লাইভ ডাটায় ফিরবে
            });
        }
    }, 100); 
}

module.exports = { 
    fetchDailyReports,
    initReportFilters 
};