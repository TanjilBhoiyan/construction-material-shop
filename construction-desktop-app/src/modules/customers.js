const { supabase } = require('../config/supabaseClient');

async function fetchCustomers() {
    const customerTbody = document.getElementById('customer-tbody');
    try {
        if (!customerTbody) return;
        
        let { data: customers, error } = await supabase
            .from('customers')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        customerTbody.innerHTML = '';
        let totalMarketDue = 0;

        if (!customers || customers.length === 0) {
            customerTbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">কোনো কাস্টমার ডাটা পাওয়া যায়নি।</td></tr>`;
            if(document.getElementById('total-market-due')) document.getElementById('total-market-due').innerText = "0.00";
            return;
        }

        window.cachedCustomers = customers;

        customers.forEach(cust => {
            totalMarketDue += cust.total_due;
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

        const marketDueElem = document.getElementById('total-market-due');
        if (marketDueElem) marketDueElem.innerText = totalMarketDue.toFixed(2);

    } catch (err) {
        console.error("Customer ledger loading failed:", err.message);
    }
}

// গ্লোবাল ফাংশন ও ইভেন্ট লিসেনারগুলো মডিউল চালুর সময় বাইন্ড হবে
function initCustomerModule() {
    window.triggerPaymentModal = function(id) {
        if(!window.cachedCustomers) return;
        const cust = window.cachedCustomers.find(c => c.id === id);
        if(cust) {
            window.openPaymentModal(cust.id, cust.name, cust.total_due);
        }
    }

    window.openPaymentModal = function(id, name, totalDue) {
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

    // মডাল ক্লোজ ও সাবমিট বাটন লিসেনার (একবারই লিসেনার সেট করার সেফ প্র্যাকটিস)
    if (!window.customerListenersSet) {
        document.addEventListener('click', async function(e) {
            if(e.target && e.target.id === 'close-modal-btn') {
                const paymentModal = document.getElementById('payment-modal');
                if(paymentModal) paymentModal.classList.add('hidden');
            }

            if(e.target && e.target.id === 'submit-payment-btn') {
                const modalCustId = document.getElementById('modal-cust-id');
                const modalCustDue = document.getElementById('modal-cust-due');
                const modalPayAmount = document.getElementById('modal-pay-amount');
                const paymentModal = document.getElementById('payment-modal');

                const custId = modalCustId.value;
                const payAmount = parseFloat(modalPayAmount.value) || 0;
                const currentDue = parseFloat(modalCustDue.innerText.replace('৳', '')) || 0;

                if (payAmount <= 0) {
                    alert("দয়া করে সঠিক জমার পরিমাণ লিখুন।");
                    return;
                }
                if (payAmount > currentDue) {
                    alert(`সতর্কতা: কাস্টমারের বকেয়া ৳${currentDue.toFixed(2)}, আপনি বকেয়ার চেয়ে বেশি টাকা জমা নিতে পারবেন না!`);
                    return;
                }

                try {
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

                    alert(`🎉 ৳${payAmount} সফলভাবে জমা নেওয়া হয়েছে!\nবর্তমান বকেয়া: ৳${updatedDue.toFixed(2)}`);
                    
                    if(paymentModal) paymentModal.classList.add('hidden');
                    fetchCustomers(); 

                } catch (err) {
                    alert("টাকা জমা নিতে সমস্যা হয়েছে: " + err.message);
                }
            }
        });
        window.customerListenersSet = true;
    }
}

module.exports = { fetchCustomers, initCustomerModule };