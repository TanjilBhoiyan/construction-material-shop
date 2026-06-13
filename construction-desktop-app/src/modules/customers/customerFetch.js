const { supabase } = require('../../config/supabaseClient'); // 👈 ২ বার পেছনে গিয়ে config ফোল্ডার ধরবে

let currentCustomerPage = 1;
const itemsPerPage = 20;
let isSearching = false;

async function fetchCustomers(searchQuery = '') {
    const customerTbody = document.getElementById('customer-tbody');
    const pageInfo = document.getElementById('customer-page-info'); 

    try {
        if (!customerTbody) return;

        // ১. টোটাল মার্কেট বকেয়া ক্যালকুলেশন
        const { data: dueSummary, error: sumError } = await supabase
            .from('customers')
            .select('total_due');

        let totalMarketDue = 0;
        if (!sumError && dueSummary) {
            totalMarketDue = dueSummary.reduce((sum, item) => sum + (item.total_due || 0), 0);
        }

        let query = supabase.from('customers').select('*');
        
        // 🔍 ২. সার্চ কুয়েরি ফিল্টার বনাম রেগুলার পেজিনেশন
        if (searchQuery.trim() !== '') {
            isSearching = true;
            query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
        } else {
            isSearching = false;
            const from = (currentCustomerPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;
            query = query.order('created_at', { ascending: false }).range(from, to);
        }

        let { data: customers, error } = await query;                          

        if (error) throw error;

        customerTbody.innerHTML = '';

        if (!customers || customers.length === 0) {
            customerTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">কোনো কাস্টমার পাওয়া যায়নি।</td></tr>`;
            const marketDueElem = document.getElementById('total-market-due');
            if (marketDueElem) marketDueElem.innerText = totalMarketDue.toFixed(2);
            setupPaginationButtons(false);
            return;
        }

        window.cachedCustomers = customers;

        // 🎯 ৩. কাস্টমার ডাটা টেবিলে রেন্ডার করা
        customers.forEach(cust => {
            const row = document.createElement('tr');
            const dueColor = cust.total_due > 0 ? 'text-red-600 font-bold' : 'text-gray-500';
            const currentAddress = cust.customer_address || cust.address || '—';

            row.innerHTML = `
                <td class="px-4 py-3 border-b font-medium text-gray-800">${cust.name}</td>
                <td class="px-4 py-3 border-b text-gray-600">${cust.father_name || '—'}</td> 
                <td class="px-4 py-3 border-b text-gray-600">${cust.phone || 'N/A'}</td>
                <td class="px-4 py-3 border-b text-gray-600">${currentAddress}</td>    
                <td class="px-4 py-3 border-b ${dueColor}">৳${cust.total_due.toFixed(2)}</td>
                <td class="px-4 py-3 border-b text-center">
                    <button onclick="triggerPaymentModal(${cust.id})" class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded shadow-sm font-medium">💵 টাকা জমা নিন</button>
                </td>
            `;
            customerTbody.appendChild(row);
        });

        const marketDueElem = document.getElementById('total-market-due');
        if (marketDueElem) marketDueElem.innerText = totalMarketDue.toFixed(2);

        // 🔍 ৪. সার্চিং মোড অনুযায়ী পেজিনেশন কন্ট্রোল
        if (isSearching) {
            if (pageInfo) pageInfo.innerText = `সার্চ রেজাল্ট: ${customers.length} জন`;
            setupPaginationButtons(false);
        } else {
            if (pageInfo) pageInfo.innerText = `পেজ: ${currentCustomerPage}`;
            setupPaginationButtons(customers.length === itemsPerPage);
        }

    } catch (err) {
        console.error("Customer ledger loading failed:", err.message);
    }
}

function setupPaginationButtons(hasNextPage) {
    const prevBtn = document.getElementById('customer-prev-btn');
    const nextBtn = document.getElementById('customer-next-btn');

    if (prevBtn) prevBtn.disabled = isSearching ? true : currentCustomerPage === 1;
    if (nextBtn) nextBtn.disabled = isSearching ? true : !hasNextPage;
}

// এক্সপোর্ট অবজেক্ট (যাতে বাইরের ফাইল পেজ নম্বর চেঞ্জ করতে পারে)
// এই অবজেক্টটি একদম নিচের module.exports এ রিপ্লেস করুন
module.exports = {
    fetchCustomers,
    getPage: () => currentCustomerPage,
    setPage: (val) => { currentCustomerPage = val; },
    getIsSearching: () => isSearching
};