const { supabase } = require('../config/supabaseClient');

// 📌 পেজিনেশন ট্র্যাকিং ভ্যারিয়েবলস
let currentCustomerPage = 1;
const itemsPerPage = 20;

async function fetchCustomers() {
    const customerTbody = document.getElementById('customer-tbody');
    const pageInfo = document.getElementById('customer-page-info'); // 👈 পেজ নম্বর দেখানোর জন্য

    try {
        if (!customerTbody) return;

        // ১. টোটাল মার্কেট বকেয়া (Total Market Due) লাইভ ক্যালকুলেশন
        // যেহেতু আমরা range() দিয়ে ডাটা কাটব, তাই পুরো ডাটাবেজের বকেয়া সামারি আলাদাভাবে টেনে আনা হলো
        const { data: dueSummary, error: sumError } = await supabase
            .from('customers')
            .select('total_due');

        let totalMarketDue = 0;
        if (!sumError && dueSummary) {
            totalMarketDue = dueSummary.reduce((sum, item) => sum + (item.total_due || 0), 0);
        }

        // ২. পেজিনেশনের জন্য রেঞ্জ বা লিমিট হিসাব করা (0-based index)
        const from = (currentCustomerPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        // ৩. সুপাবেজ থেকে ২০টি ডাটা Descending অর্ডারে নিয়ে আসা
        // 'created_at' কলাম অনুযায়ী করা হলো, যাতে একদম নতুন কাস্টমার বা এন্ট্রি সবার উপরে আসে
        let { data: customers, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false }) // 👈 নতুন ডাটা সবার উপরে (Descending)
            .range(from, to);                          // 👈 একবারে মাত্র ২০টা ডাটা লিমিট

        if (error) throw error;

        customerTbody.innerHTML = '';

        if (!customers || customers.length === 0) {
            customerTbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">কোনো কাস্টমার ডাটা পাওয়া যায়নি।</td></tr>`;
            const marketDueElem = document.getElementById('total-market-due');
            if (marketDueElem) marketDueElem.innerText = totalMarketDue.toFixed(2);
            setupPaginationButtons(false);
            return;
        }

        window.cachedCustomers = customers;

        // ৪. কাস্টমার ডাটা টেবিলে রেন্ডার করা (আপনার ওরিজিনাল লজিক)
        customers.forEach(cust => {
            const row = document.createElement('tr');
            const dueColor = cust.total_due > 0 ? 'text-red-600 font-bold' : 'text-gray-500';

            row.innerHTML = `
                <td class="px-4 py-3 border-b font-medium text-gray-800">${cust.name}</td>
                <td class="px-4 py-3 border-b text-gray-600">${cust.phone || 'N/A'}</td>
                <td class="px-4 py-3 border-b ${dueColor}">৳${cust.total_due.toFixed(2)}</td>
                <td class="px-4 py-3 border-b text-center">
                    <button onclick="triggerPaymentModal(${cust.id})" class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded shadow-sm font-medium">💵 টাকা জমা নিন</button>
                </td>
            `;
            customerTbody.appendChild(row);
        });

        // মোট বাজার বকেয়া স্ক্রিনে আপডেট
        const marketDueElem = document.getElementById('total-market-due');
        if (marketDueElem) marketDueElem.innerText = totalMarketDue.toFixed(2);

        // ৫. পেজ ইনফো এবং বাটনের স্ট্যাটাস সিঙ্ক করা
        if (pageInfo) pageInfo.innerText = `পেজ: ${currentCustomerPage}`;

        // কাস্টমার সংখ্যা ঠিক ২০টা হলে পরের পেজে আরও ডাটা থাকতে পারে, তাই বাটন কন্ডিশন সেট করা
        setupPaginationButtons(customers.length === itemsPerPage);

    } catch (err) {
        console.error("Customer ledger loading failed:", err.message);
    }
}

// 🛠️ পেজিনেশন বাটন এনেবল/ডিসেবল করার হেল্পার ফাংশন
function setupPaginationButtons(hasNextPage) {
    const prevBtn = document.getElementById('customer-prev-btn');
    const nextBtn = document.getElementById('customer-next-btn');

    if (prevBtn) prevBtn.disabled = currentCustomerPage === 1; // ১ম পেজে থাকলে আগের পেজ বাটন অফ
    if (nextBtn) nextBtn.disabled = !hasNextPage;             // পরের পেজে ডাটা না থাকলে নেক্সট বাটন অফ
}

// গলোবাল ফাংশন ও ইভেন্ট লিসেনারগুলো মডিউল চালুর সময় বাইন্ড হবে
function initCustomerModule() {
    window.triggerPaymentModal = function (id) {
        if (!window.cachedCustomers) return;
        const cust = window.cachedCustomers.find(c => c.id === id);
        if (cust) {
            window.openPaymentModal(cust.id, cust.name, cust.total_due);
        }
    }

    window.openPaymentModal = function (id, name, totalDue) {
        const paymentModal = document.getElementById('payment-modal');
        const modalCustId = document.getElementById('modal-cust-id');
        const modalCustName = document.getElementById('modal-cust-name');
        const modalCustDue = document.getElementById('modal-cust-due');
        const modalPayAmount = document.getElementById('modal-pay-amount');

        if (!paymentModal) return;

        modalCustId.value = id;
        modalCustName.innerText = name;
        modalCustDue.innerText = `৳${parseFloat(totalDue).toFixed(2)}`;
        modalPayAmount.value = '';
        paymentModal.classList.remove('hidden');
    }

    // 🛠️ পেজিনেশন বাটনগুলোর ক্লিক ইভেন্ট লিসেনার বাইন্ডিং (ডুপ্লিকেট এভয়েড ট্রিক)
    const prevBtn = document.getElementById('customer-prev-btn');
    const nextBtn = document.getElementById('customer-next-btn');

    if (prevBtn && !prevBtn.dataset.listenerAttached) {
        prevBtn.addEventListener('click', async () => {
            if (currentCustomerPage > 1) {
                currentCustomerPage--;
                await fetchCustomers();
            }
        });
        prevBtn.dataset.listenerAttached = "true";
    }

    if (nextBtn && !nextBtn.dataset.listenerAttached) {
        nextBtn.addEventListener('click', async () => {
            currentCustomerPage++;
            await fetchCustomers();
        });
        nextBtn.dataset.listenerAttached = "true";
    }

    // มডাল ক্লোজ ও সাবমিট বাটন লিসেনার (আপনার ওরিজিনাল গ্লোবাল লিসেনার)
    if (!window.customerListenersSet) {
        document.addEventListener('click', async function (e) {
            if (e.target && e.target.id === 'close-modal-btn') {
                const paymentModal = document.getElementById('payment-modal');
                if (paymentModal) paymentModal.classList.add('hidden');
            }

            if (e.target && e.target.id === 'submit-payment-btn') {
                const modalCustId = document.getElementById('modal-cust-id');
                const modalCustDue = document.getElementById('modal-cust-due');
                const modalPayAmount = document.getElementById('modal-pay-amount');
                const paymentModal = document.getElementById('payment-modal');

                const custId = modalCustId.value;
                const payAmount = parseFloat(modalPayAmount.value) || 0;
                const currentDue = parseFloat(modalCustDue.innerText.replace('৳', '')) || 0;

                // Toast helper
                const showToast = (message, isError = false) => {
                    const oldToast = document.getElementById('app-toast');
                    if (oldToast) oldToast.remove();

                    const toast = document.createElement('div');
                    toast.id = 'app-toast';
                    toast.innerText = message;

                    toast.className = `fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 ${isError ? 'bg-red-600' : 'bg-green-600'
                        }`;

                    document.body.appendChild(toast);

                    setTimeout(() => {
                        toast.style.opacity = '0';
                        setTimeout(() => toast.remove(), 300);
                    }, 3000);
                };

                if (payAmount <= 0) {
                    showToast("দয়া করে সঠিক জমার পরিমাণ লিখুন।", true);
                    return;
                }

                if (payAmount > currentDue) {
                    showToast(
                        `বকেয়ার চেয়ে বেশি টাকা জমা নেওয়া যাবে না। বর্তমান বকেয়া: ৳${currentDue.toFixed(2)}`,
                        true
                    );
                    return;
                }

                try {
                    const { error: paymentErr } = await supabase
                        .from('customer_payments')
                        .insert([{
                            customer_id: custId,
                            amount_paid: payAmount
                        }]);

                    if (paymentErr) throw paymentErr;

                    const updatedDue = currentDue - payAmount;

                    const { error: custUpdateErr } = await supabase
                        .from('customers')
                        .update({
                            total_due: updatedDue
                        })
                        .eq('id', custId);

                    if (custUpdateErr) throw custUpdateErr;

                    showToast(
                        `🎉 ৳${payAmount.toFixed(2)} সফলভাবে জমা নেওয়া হয়েছে!`
                    );

                    if (paymentModal) {
                        paymentModal.classList.add('hidden');
                    }

                    await fetchCustomers();

                    // Electron focus restore
                    setTimeout(() => {
                        window.focus();
                        document.body.focus();
                    }, 50);

                } catch (err) {
                    showToast(
                        "টাকা জমা নিতে সমস্যা হয়েছে: " + err.message,
                        true
                    );
                }
            }
        });
        window.customerListenersSet = true;
    }
}

module.exports = { fetchCustomers, initCustomerModule };