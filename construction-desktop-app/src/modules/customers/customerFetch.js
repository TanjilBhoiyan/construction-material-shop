const { CustomerRepository } = require('./customer.repository');
const { openCustomerLedger } = require('./customerDetails');

let currentCustomerPage = 1;
const itemsPerPage = 20;
let isSearching = false;

async function fetchCustomers(searchQuery = '') {
    const customerTbody = document.getElementById('customer-tbody');
    const pageInfo = document.getElementById('customer-page-info'); 

    try {
        if (!customerTbody) return;

        const { data: dueSummary, error: sumError } = await CustomerRepository.getMarketDueSummary();
        let totalMarketDue = 0;
        if (!sumError && dueSummary) {
            totalMarketDue = dueSummary.reduce((sum, item) => sum + (item.total_due || 0), 0);
        }

        isSearching = searchQuery.trim() !== '';
        const from = (currentCustomerPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data: customers, error } = await CustomerRepository.getCustomers(searchQuery, from, to);
        if (error) throw error;

        customerTbody.innerHTML = '';
        if (!customers || customers.length === 0) {
            customerTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">কোনো কাস্টমার পাওয়া যায়নি।</td></tr>`;
            
            // নিরাপদভাবে আপডেট
            const marketDueElem = document.getElementById('total-market-due');
            if (marketDueElem) {
                marketDueElem.innerText = totalMarketDue.toFixed(2);
            }
            
            setupPaginationButtons(false);
            return;
        }

        window.cachedCustomers = customers;

        customers.forEach(cust => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            
            const dueColor = cust.total_due > 0 ? 'text-red-600 font-bold' : 'text-gray-500';
            row.innerHTML = `
                <td class="px-4 py-3 border-b font-medium text-gray-800">${cust.name}</td>
                <td class="px-4 py-3 border-b text-gray-600">${cust.father_name || '—'}</td> 
                <td class="px-4 py-3 border-b text-gray-600">${cust.phone || 'N/A'}</td>
                <td class="px-4 py-3 border-b text-gray-600">${cust.customer_address || cust.address || '—'}</td>    
                <td class="px-4 py-3 border-b ${dueColor}">৳${cust.total_due.toFixed(2)}</td>
                <td class="px-4 py-3 border-b text-center">
                    <button class="btn-collect-payment bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded shadow-sm font-medium" onclick="triggerPaymentModal(${cust.id})">
                        💵 টাকা জমা নিন
                    </button>
                </td>
            `;

            row.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-collect-payment') || e.target.closest('.btn-collect-payment')) return;
                openCustomerLedger(cust);
            });
            customerTbody.appendChild(row);
        });

        const marketDueElem = document.getElementById('total-market-due');
        if (marketDueElem) {
            marketDueElem.innerText = totalMarketDue.toFixed(2);
        }
        
        if (isSearching) {
            if (pageInfo) pageInfo.innerText = "সার্চ রেজাল্ট: " + customers.length + " জন";
            setupPaginationButtons(false);
        } else {
            if (pageInfo) pageInfo.innerText = "পেজ: " + currentCustomerPage;
            setupPaginationButtons(customers.length === itemsPerPage);
        }

    } catch (err) {
        console.error("Customer loading failed:", err.message);
    }
}

function setupPaginationButtons(hasNextPage) {
    const prevBtn = document.getElementById('customer-prev-btn');
    const nextBtn = document.getElementById('customer-next-btn');
    if (prevBtn) prevBtn.disabled = isSearching ? true : currentCustomerPage === 1;
    if (nextBtn) nextBtn.disabled = isSearching ? true : !hasNextPage;
}

module.exports = { 
    fetchCustomers, 
    getPage: function() { return currentCustomerPage; }, 
    setPage: function(val) { currentCustomerPage = val; }, 
    getIsSearching: function() { return isSearching; } 
};