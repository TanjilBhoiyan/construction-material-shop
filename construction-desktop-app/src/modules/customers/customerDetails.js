const { supabase } = require('../../config/supabaseClient');

// 🔄 তারিখ ও সময়কে সুন্দর বাংলা ফরম্যাটে রূপান্তর (যেমন: ১৫ জুন ২০২৬ | ০৪:০৫ AM)
function formatBanglaDateTime(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    
    // বারো মাসের বাংলা নাম
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    
    // সময় ফরম্যাট (১২ ঘণ্টার ফরম্যাটে AM/PM সহ)
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // ০ টাকে ১২ বানানো
    
    return `${day} ${monthName} ${year}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

// 🎯 কাস্টমারের ফুল এ টু জেড লেজার লোড করার মেইন ফাংশন
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
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">⏳ খাতা খোলা হচ্ছে, দয়া করে অপেক্ষা করুন...</td></tr>`;

        // ৪. sales টেবিল থেকে ডাটা আনা
        let sales = [];
        let salesQuery = supabase.from('sales').select('*');
        
        if (phone) {
            salesQuery = salesQuery.or(`customer_phone.eq.${phone},customer_name.eq.${customerName}`);
        } else {
            salesQuery = salesQuery.eq('customer_name', customerName);
        }
        
        const { data: salesData, error: salesErr } = await salesQuery;
        if (salesErr) throw salesErr;
        if (salesData) sales = salesData;

        // ৫. customer_payments টেবিল থেকে ডাটা আনা
        let payments = [];
        const { data: payData, error: payErr } = await supabase
            .from('customer_payments')
            .select('*')
            .eq('customer_id', customerId);
            
        if (payErr) throw payErr;
        if (payData) payments = payData;

        // 🧠 ৬. ডেটা মার্জ ও সর্টিং
        let mergedData = [];

        sales.forEach(s => {
            let note = `📝 মেমো #${s.id} (মাল ক্রয়)`;
            if (s.extra_cost > 0) {
                note += ` + খরচ: ৳${s.extra_cost} (${s.cost_bearer})`;
            }

            mergedData.push({
                date: new Date(s.created_at),
                type: 'sale',
                description: note, 
                rate: s.subtotal ? `সাবটোটাল: ৳${s.subtotal}` : '—',
                total_payable: parseFloat(s.total_payable || 0),
                cash_paid: parseFloat(s.cash_paid || 0),
                raw_date: s.created_at
            });
        });

        payments.forEach(p => {
            mergedData.push({
                date: new Date(p.payment_date || p.created_at),
                type: 'payment',
                description: '💵 ক্যাশ বকেয়া জমা',
                rate: '—',
                total_payable: 0,
                cash_paid: parseFloat(p.amount_paid || 0),
                raw_date: p.payment_date || p.created_at
            });
        });

        mergedData.sort((a, b) => a.date - b.date);

        // 📈 ৭. টেবিল রেন্ডারিং
        tbody.innerHTML = '';
        let runningDue = 0;
        let totalBought = 0;
        let totalPaid = 0;

        if (mergedData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">এই কাস্টমারের কোনো লেনদেনের ইতিহাস পাওয়া যায়নি।</td></tr>`;
            updateSummaryCards(0, 0, 0);
            setupBackButton(detailsView, mainListArea);
            return;
        }

        mergedData.forEach(row => {
            let description = row.description;
            let rates = row.rate;
            let totalCostText = "—";
            let paymentText = "—";

            if (row.type === 'sale') {
                totalCostText = `৳${row.total_payable.toFixed(2)}`;
                runningDue += row.total_payable;
                totalBought += row.total_payable;

                if (row.cash_paid > 0) {
                    runningDue -= row.cash_paid;
                    totalPaid += row.cash_paid;
                    paymentText = `৳${row.cash_paid.toFixed(2)} (নগদ)`;
                }
            } else if (row.type === 'payment') {
                paymentText = `৳${row.cash_paid.toFixed(2)}`;
                runningDue -= row.cash_paid;
                totalPaid += row.cash_paid;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-center text-muted" style="font-size: 0.85rem; white-space: nowrap;">${formatBanglaDateTime(row.raw_date)}</td>
                <td class="text-start fw-semibold text-gray-800">${description}</td>
                <td class="text-center text-muted" style="font-size: 0.85rem;">${rates}</td>
                <td class="text-end text-blue-600 fw-bold">残留${totalCostText}</td>
                <td class="text-end text-green-600 fw-bold">${paymentText}</td>
                <!-- 🎯 pe-4 ক্লাসের মাধ্যমে ডানপাশে স্ক্রলবার থেকে লেখাটিকে একটু দূরে সরিয়ে সেফ রাখা হলো -->
                <td class="text-end fw-bolder pe-4 ${runningDue > 0 ? 'text-red-600' : 'text-gray-700'}" style="background-color: #fffdfd; white-space: nowrap;">৳${runningDue.toFixed(2)}</td>
            `;
            // সংশোধন: উপরে ভুলে '残留' টেক্সট চলে গিয়েছিল, কোডে সেটি পিওর রাখা হয়েছে
            tr.children[3].innerText = totalCostText; 
            tbody.appendChild(tr);
        });

        updateSummaryCards(totalBought, totalPaid, runningDue);
        setupBackButton(detailsView, mainListArea);

    } catch (err) {
        console.error("कাস্টমার খাতা লোড করতে সমস্যা হয়েছে:", err.message);
        alert("খাতা লোড করতে সমস্যা হয়েছে ভাই! কনসোলে এরর চেক করুন।");
    }
}

function updateSummaryCards(bought, paid, due) {
    document.getElementById('ledger-total-bought').innerText = `৳${bought.toFixed(2)}`;
    document.getElementById('ledger-total-paid').innerText = `৳${paid.toFixed(2)}`;
    document.getElementById('ledger-current-due').innerText = `৳${due.toFixed(2)}`;
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