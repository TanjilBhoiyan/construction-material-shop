// src/renderer/js/modules/customer.ui.js
const { supabase } = require('../../../shared/config/supabaseClient');

const CustomerUI = {
    render(container) {
        console.log("Customer UI Initialized");
        this.fetchCustomers();
        this.initEventListeners();
    },

    async fetchCustomers() {
        const tbody = document.getElementById('customer-tbody');
        if (!tbody) return;

        // ডেটাবেজ থেকে কাস্টমার তালিকা নিয়ে আসা
        const { data, error } = await supabase.from('customers').select('*');
        
        if (data) {
            tbody.innerHTML = data.map(c => `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">${c.name}</td>
                    <td class="px-4 py-3">${c.father_name || '---'}</td>
                    <td class="px-4 py-3">${c.phone}</td>
                    <td class="px-4 py-3">${c.address || '---'}</td>
                    <td class="px-4 py-3 font-bold text-red-600">৳${parseFloat(c.due_amount).toFixed(2)}</td>
                    <td class="px-4 py-3 text-center">
                        <button onclick="CustomerUI.openPaymentModal(${c.id}, '${c.name}', ${c.due_amount})" class="text-green-600 font-bold mr-2">জমা নিন</button>
                        <button onclick="CustomerUI.showLedger(${c.id})" class="text-blue-600 font-bold">খতিয়ান</button>
                    </td>
                </tr>
            `).join('');
        }
    },

    initEventListeners() {
        // মডাল ক্লোজ বাটন
        document.getElementById('close-modal-btn').addEventListener('click', () => {
            document.getElementById('payment-modal').classList.add('hidden');
        });

        // কাস্টমার লিস্টে ফেরার বাটন
        document.getElementById('btn-back-to-customer-list').addEventListener('click', () => {
            document.getElementById('customer-main-list-area').style.display = 'block';
            document.getElementById('customer-ledger-details-view').style.display = 'none';
        });
    },

    openPaymentModal(id, name, due) {
        document.getElementById('modal-cust-id').value = id;
        document.getElementById('modal-cust-name').innerText = name;
        document.getElementById('modal-cust-due').innerText = '৳' + due;
        document.getElementById('payment-modal').classList.remove('hidden');
    },

    showLedger(id) {
        // মেইন লিস্ট হাইড করে লেজার ভিউ দেখানো
        document.getElementById('customer-main-list-area').style.display = 'none';
        document.getElementById('customer-ledger-details-view').style.display = 'block';
        // এখানে লেজার ডেটা লোড করার ফাংশন কল করতে হবে
    }
};

module.exports = { CustomerUI };