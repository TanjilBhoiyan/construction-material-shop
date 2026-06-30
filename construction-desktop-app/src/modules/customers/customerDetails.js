//const { supabase } = require('../../config/supabaseClient');
const { CustomerRepository } = require('./customer.repository');


// 🔄 তারিখ ও সময়কে সুন্দর বাংলা ফরম্যাটে রূপান্তর
function formatBanglaDateTime(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${day} ${monthName} ${year}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

// 🎯 কাস্টমারের ফুল লেজার লোড করার মেইন ফাংশন (ক্যাশ এরর প্রুফ)
async function openCustomerLedger(customer) {
    try {
        const customerId = customer.id;
        const customerName = customer.name || 'অজানা কাস্টমার';
        const phone = customer.phone || ''; 
        const fatherName = customer.father_name || '—';

        const mainListArea = document.getElementById('customer-main-list-area');
        const detailsView = document.getElementById('customer-ledger-details-view');
        
        if (mainListArea) mainListArea.style.display = 'none';
        if (detailsView) detailsView.style.display = 'block';

        document.getElementById('ledger-cust-name').innerText = customerName;
        document.getElementById('ledger-cust-father').innerText = fatherName;
        document.getElementById('ledger-cust-phone').innerText = phone || '—';

        const tbody = document.getElementById('customer-ledger-tbody');
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">⏳ খাতা খোলা হচ্ছে, দয়া করে অপেক্ষা করুন...</td></tr>`;

        // 🧠 রিপোজিটরি ব্যবহার করে ডাটা আনা
        const { data: salesData, error: salesErr } = await CustomerRepository.getSalesByCustomer(phone, customerName);
        if (salesErr) throw salesErr;
        const sales = salesData || [];

        let allSaleItems = [];
        if (sales.length > 0) {
            const saleIds = sales.map(s => s.id);
            const { data: itemsData, error: itemsErr } = await CustomerRepository.getSaleItemsBySaleIds(saleIds);
            if (!itemsErr && itemsData) allSaleItems = itemsData;
        }

        const { data: payData, error: payErr } = await CustomerRepository.getCustomerPayments(customerId);
        if (payErr) throw payErr;
        const payments = payData || [];

        // 🔀 ডেটা মার্জ ও সর্টিং
        let mergedData = [];

        sales.forEach(s => {
            const currentItems = allSaleItems.filter(item => item.sale_id === s.id);
            let itemsList = [];
            let ratesList = [];

            if (currentItems && currentItems.length > 0) {
                currentItems.forEach(item => {
                    const prodName = item.products ? item.products.name : 'মাল';
                    itemsList.push(`${prodName} (${item.quantity})`);
                    ratesList.push(`${prodName}: ৳${item.price_per_unit}`);
                });
            }

            let itemDetailsText = itemsList.length > 0 ? ` [ ${itemsList.join(', ')} ]` : ' (মাল ক্রয়)';
            let note = `📝 মেমো #${s.id}${itemDetailsText}`;
            if (s.labor_cost > 0) note += ` + খরচ: ৳${s.labor_cost} (${s.labor_bearer})`;

            mergedData.push({
                id: s.id, date: new Date(s.created_at), type: 'sale',
                description: note, rate: ratesList.length > 0 ? ratesList.join('<br>') : `সাবটোটাল: ৳${s.subtotal}`,
                males_dam: parseFloat(s.subtotal || 0), total_payable: parseFloat(s.total_payable || 0), 
                cash_paid: parseFloat(s.cash_paid || 0), raw_date: s.created_at
            });
        });

        payments.forEach(p => {
            mergedData.push({
                id: p.id, date: new Date(p.payment_date || p.created_at), type: 'payment',
                description: '💵 ক্যাশ বকেয়া জমা', rate: '—', males_dam: 0, total_payable: 0,
                cash_paid: parseFloat(p.amount_paid || 0), raw_date: p.payment_date || p.created_at
            });
        });

        mergedData.sort((a, b) => (a.date.getTime() !== b.date.getTime()) ? a.date - b.date : a.id - b.id);

        // 📈 টেবিল রেন্ডারিং
        tbody.innerHTML = '';
        let runningDue = 0, totalBought = 0, totalPaid = 0;

        if (mergedData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">এই কাস্টমারের কোনো লেনদেনের ইতিহাস পাওয়া যায়নি।</td></tr>`;
            updateSummaryCards(0, 0, 0);
            setupBackButton(detailsView, mainListArea);
            return;
        }

        mergedData.forEach(row => {
            let totalCostText = (row.type === 'sale') ? `৳${row.males_dam.toFixed(2)}` : "—";
            let paymentText = (row.cash_paid > 0) ? `৳${row.cash_paid.toFixed(2)} ${row.type === 'sale' ? '(নগদ)' : ''}` : "—";

            if (row.type === 'sale') {
                runningDue += row.total_payable;
                totalBought += row.total_payable;
                if (row.cash_paid > 0) { runningDue -= row.cash_paid; totalPaid += row.cash_paid; }
            } else {
                runningDue -= row.cash_paid;
                totalPaid += row.cash_paid;
            }

            const tr = document.createElement('tr');
            tr.className = "border-b border-gray-100 hover:bg-gray-50";
            tr.innerHTML = `
                <td class="px-3 py-3 text-center text-gray-500 text-xs" style="white-space: nowrap;">${formatBanglaDateTime(row.raw_date)}</td>
                <td class="px-3 py-3 text-left text-sm font-medium text-gray-900">${row.description}</td>
                <td class="px-3 py-3 text-center text-xs text-gray-600 leading-relaxed">${row.rate}</td>
                <td class="px-3 py-3 text-right text-sm font-semibold text-blue-600">${totalCostText}</td>
                <td class="px-3 py-3 text-right text-sm font-semibold text-green-600">${paymentText}</td>
                <td class="px-3 py-3 text-right text-sm font-bold pr-6 ${runningDue > 0 ? 'text-red-600' : 'text-gray-700'}" style="white-space: nowrap;">৳${runningDue.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });

        updateSummaryCards(totalBought, totalPaid, runningDue);
        setupBackButton(detailsView, mainListArea);

    } catch (err) {
        console.error("কাস্টমার খাতা লোড করতে সমস্যা হয়েছে:", err.message);
        alert("খাতা লোড করতে সমস্যা হয়েছে ভাই! কনসোলে এরর চেক করুন।");
    }
}

function updateSummaryCards(bought, paid, due) {
    const elBought = document.getElementById('ledger-total-bought');
    const elPaid = document.getElementById('ledger-total-paid');
    const elDue = document.getElementById('ledger-current-due');

    if (elBought) elBought.innerText = `৳${bought.toFixed(2)}`;
    if (elPaid) elPaid.innerText = `৳${paid.toFixed(2)}`;
    if (elDue) elDue.innerText = `৳${due.toFixed(2)}`;
}

function setupBackButton(detailsView, mainListArea) {
    const backBtn = document.getElementById('btn-back-to-customer-list');
    if (backBtn) {
        backBtn.onclick = function(e) {
            e.preventDefault();
            if (detailsView) detailsView.style.display = 'none';
            if (mainListArea) mainListArea.style.display = 'block';
        };
    }
}

module.exports = { openCustomerLedger };