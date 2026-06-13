const { supabase } = require('../../config/supabaseClient'); // 👈 ২ বার পেছনে গিয়ে config ফোল্ডার ধরবে
const { fetchCustomers } = require('./customerFetch');
function setupPaymentLogics() {
    window.triggerPaymentModal = function (id) {
        if (!window.cachedCustomers) return;
        const cust = window.cachedCustomers.find(c => c.id === id);
        if (cust) {
            window.openPaymentModal(cust.id, cust.name, cust.total_due, cust.father_name, (cust.customer_address || cust.address));
        }
    };

    window.openPaymentModal = function (id, name, totalDue, fatherName, address) {
        const paymentModal = document.getElementById('payment-modal');
        const modalCustId = document.getElementById('modal-cust-id');
        const modalCustName = document.getElementById('modal-cust-name');
        const modalCustDue = document.getElementById('modal-cust-due');
        const modalPayAmount = document.getElementById('modal-pay-amount');

        if (!paymentModal || !modalCustName) return;

        modalCustId.value = id;
        modalCustDue.innerText = `৳${parseFloat(totalDue).toFixed(2)}`;
        modalPayAmount.value = '';

        const fStr = fatherName ? ` <span class="text-sm font-normal text-gray-600">(পিতা: ${fatherName})</span>` : '';
        const aStr = address ? `<div class="text-xs text-gray-500 font-normal mt-1">🏠 ঠিকানা: ${address}</div>` : '';
        modalCustName.innerHTML = `<span class="font-bold text-base">${name}</span>${fStr}${aStr}`;

        paymentModal.classList.remove('hidden');
    };

    // মডাল সাবমিট ও ক্লোজ করার গ্লোবাল ক্লিক ইভেন্ট লিসেনার
    if (!window.customerListenersSet) {
        document.addEventListener('click', async function (e) {
            // ক্লোজ বাটন লজিক
            if (e.target && e.target.id === 'close-modal-btn') {
                const paymentModal = document.getElementById('payment-modal');
                if (paymentModal) paymentModal.classList.add('hidden');
            }

            // জমা নিশ্চিতকরণ বাটন লজিক
            if (e.target && e.target.id === 'submit-payment-btn') {
                const submitBtn = e.target;
                const modalCustId = document.getElementById('modal-cust-id');
                const modalCustDue = document.getElementById('modal-cust-due');
                const modalPayAmount = document.getElementById('modal-pay-amount');
                const paymentModal = document.getElementById('payment-modal');

                const custId = modalCustId.value;
                const payAmount = parseFloat(modalPayAmount.value) || 0;
                const currentDue = parseFloat(modalCustDue.innerText.replace('৳', '')) || 0;

                const showToast = (message, isError = false) => {
                    const oldToast = document.getElementById('app-toast');
                    if (oldToast) oldToast.remove();

                    const toast = document.createElement('div');
                    toast.id = 'app-toast';
                    toast.innerText = message;
                    toast.className = `fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 ${isError ? 'bg-red-600' : 'bg-green-600'}`;
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
                    showToast(`বকেয়ার চেয়ে বেশি টাকা জমা নেওয়া যাবে না। বর্তমান বকেয়া: ৳${currentDue.toFixed(2)}`, true);
                    return;
                }

                try {
                    // 🔒 ডাবল-ক্লিক লক সক্রিয়
                    submitBtn.disabled = true;
                    submitBtn.innerText = "⏳ প্রসেস হচ্ছে...";

                    const { error: paymentErr } = await supabase
                        .from('customer_payments')
                        .insert([{ customer_id: custId, amount_paid: payAmount }]);

                    if (paymentErr) throw paymentErr;

                    const updatedDue = currentDue - payAmount;

                    const { error: custUpdateErr } = await supabase
                        .from('customers')
                        .update({ total_due: updatedDue })
                        .eq('id', custId);

                    if (custUpdateErr) throw custUpdateErr;

                    showToast(`🎉 ৳${payAmount.toFixed(2)} সফলভাবে জমা নেওয়া হয়েছে!`);
                    if (paymentModal) paymentModal.classList.add('hidden');

                    // রিলোড করার সময় ফিল্টার ভ্যালু ধরে রাখা
                    const currentSearchVal = document.getElementById('customer-search-input')?.value || '';
                    await fetchCustomers(currentSearchVal);

                    setTimeout(() => {
                        window.focus();
                        document.body.focus();
                    }, 50);

                } catch (err) {
                    showToast("টাকা জমা নিতে সমস্যা হয়েছে: " + err.message, true);
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = "জমা নিশ্চিত করুন";
                    }
                }
            }
        });
        window.customerListenersSet = true;
    }
}

module.exports = { setupPaymentLogics };