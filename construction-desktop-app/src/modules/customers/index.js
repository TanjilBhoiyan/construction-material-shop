const { fetchCustomers, getPage, setPage, getIsSearching } = require('./customerFetch');
const { setupPaymentLogics } = require('./customerPayment');
const { openCustomerLedger } = require('./customerDetails');

function initCustomerModule() {
    // ১. পেমেন্ট ও মডাল লজিক রান করা
    setupPaymentLogics();

    // 🔍 ২. লাইভ সার্চ ইনপুট (১৫০ms ডিবান্স টাইমার)
    const searchInput = document.getElementById('customer-search-input');
    if (searchInput && !searchInput.dataset.listenerAttached) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                setPage(1); 
                await fetchCustomers(e.target.value);
            }, 150);
        });
        searchInput.dataset.listenerAttached = "true";
    }

    // ➡️ ৩. পেজ নেভিগেশন বাটন ইভেন্ট
    const prevBtn = document.getElementById('customer-prev-btn');
    const nextBtn = document.getElementById('customer-next-btn');

    if (prevBtn && !prevBtn.dataset.listenerAttached) {
        prevBtn.addEventListener('click', async () => {
            const currentPage = getPage();
            const isSearching = getIsSearching();
            if (currentPage > 1 && !isSearching) {
                setPage(currentPage - 1);
                await fetchCustomers();
            }
        });
        prevBtn.dataset.listenerAttached = "true";
    }

    if (nextBtn && !nextBtn.dataset.listenerAttached) {
        nextBtn.addEventListener('click', async () => {
            const currentPage = getPage();
            const isSearching = getIsSearching();
            if (!isSearching) {
                setPage(currentPage + 1);
                await fetchCustomers();
            }
        });
        nextBtn.dataset.listenerAttached = "true";
    }
}

// 🎯 মেইন ফাইলের (renderer.js) রিকোয়ারমেন্ট অনুযায়ী অবজেক্ট এক্সপোর্ট
module.exports = { 
    fetchCustomers, 
    initCustomerModule,
    openCustomerLedger // নতুন ফিচারটি এক্সপোর্ট করা হলো
};