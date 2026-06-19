function renderDailyReports(sales, products = []) {
    const reportSalesTbody = document.getElementById('report-sales-tbody');
    
    let totalSales = 0;
    let cashReceived = 0;
    let totalDue = 0;
    let totalProfitFromSales = 0; // সেলস থেকে আসা লাভের অস্থায়ী ভেরিয়েবল
    let totalLaborCost = 0; 

    if (reportSalesTbody) reportSalesTbody.innerHTML = '';

    // ১. সেলস টেবিলের হিসাব
    sales.forEach(sale => {
        totalSales += sale.total_payable || 0;
        cashReceived += sale.cash_paid || 0;
        totalDue += sale.due_amount || 0;
        totalProfitFromSales += ((sale.subtotal || 0) * 0.15); 
        totalLaborCost += parseFloat(sale.labor_cost || 0); 

        if (reportSalesTbody) {
            const row = document.createElement('tr');
            row.className = "hover:bg-gray-50 text-sm text-gray-700";
            
            const saleDateTime = new Date(sale.created_at).toLocaleString('bn-BD', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: true
            });

            let fatherNameStr = '';
            if (sale.father_name && sale.father_name.trim() !== '' && sale.father_name !== 'EMPTY') {
                fatherNameStr = `<div class="text-xs text-gray-500 font-normal mt-0.5">পিতা: ${sale.father_name}</div>`;
            }

            const custPhone = sale.customer_phone && sale.customer_phone !== 'EMPTY' && sale.customer_phone.trim() !== '' ? sale.customer_phone : '—';
            const custAddress = sale.customer_address && sale.customer_address !== 'EMPTY' && sale.customer_address.trim() !== '' ? sale.customer_address : '—';
            const dueColor = sale.due_amount > 0 ? 'text-red-600 font-bold' : 'text-gray-500';

            row.innerHTML = `
                <td class="px-4 py-3 border-b text-gray-600">${saleDateTime}</td>
                <td class="px-4 py-3 border-b font-medium text-gray-900">
                    <div class="font-semibold">${sale.customer_name || 'অনিবন্ধিত কাস্টমার'}</div>
                    ${fatherNameStr}
                </td>
                <td class="px-4 py-3 border-b text-gray-600">${custPhone}</td>
                <td class="px-4 py-3 border-b text-gray-600">${custAddress}</td>
                <td class="px-4 py-3 border-b font-semibold text-gray-900">৳${sale.total_payable.toFixed(2)}</td>
                <td class="px-4 py-3 border-b text-green-600">৳${sale.cash_paid.toFixed(2)}</td>
                <td class="px-4 py-3 border-b ${dueColor}">৳${sale.due_amount.toFixed(2)}</td>
            `;
            reportSalesTbody.appendChild(row);
        }
    });

    // ২. ইনভেন্টরি লগ থেকে লেবার খরচ যোগ
    products.forEach(product => {
        totalLaborCost += parseFloat(product.labor_cost || 0);
    });

    // 💡 আসল নেট প্রফিট = সেলস থেকে আসা লাভ - সব ধরণের লেবার খরচ
    const finalNetProfit = totalProfitFromSales - totalLaborCost;

    // সামারি কার্ড আপডেট
    const repTotalSales = document.getElementById('rep-total-sales');
    const repCashReceived = document.getElementById('rep-cash-received');
    const repTotalDue = document.getElementById('rep-total-due');
    const repNetProfit = document.getElementById('rep-net-profit');
    const repLaborCost = document.getElementById('rep-labor-cost');

    if (repTotalSales) repTotalSales.innerText = totalSales.toFixed(2);
    if (repCashReceived) repCashReceived.innerText = cashReceived.toFixed(2);
    if (repTotalDue) repTotalDue.innerText = totalDue.toFixed(2);
    if (repNetProfit) repNetProfit.innerText = finalNetProfit.toFixed(2); // আপডেট করা প্রফিট
    if (repLaborCost) repLaborCost.innerText = totalLaborCost.toFixed(2);
}

// 🚚 লেবার খতিয়ানের ফাংশন (এটির লজিক অপরিবর্তিত)
function renderLaborReports(sales, products = []) {
    const laborTbody = document.querySelector('#labor-ledger-sub-screen tbody');
    if (!laborTbody) return;

    laborTbody.innerHTML = ''; 
    let hasLaborData = false;
    let grandTotalLabor = 0; // যোগফল ট্র্যাক করার জন্য

    sales.forEach(sale => {
        const laborCost = parseFloat(sale.labor_cost || 0);
        if (laborCost > 0) {
            hasLaborData = true;
            grandTotalLabor += laborCost;
            const row = document.createElement('tr');
            row.className = "hover:bg-gray-50 text-sm text-gray-700";
            const saleDate = new Date(sale.created_at).toLocaleDateString('bn-BD');
            const customerName = sale.customer_name && sale.customer_name !== 'EMPTY' ? sale.customer_name : 'অনিবন্ধিত কাস্টমার';

            row.innerHTML = `
                <td class="px-4 py-3 border-b">${saleDate}</td>
                <td class="px-4 py-3 border-b text-blue-600 font-medium">পণ্য বিক্রি (${customerName})</td>
                <td class="px-4 py-3 border-b">৳${laborCost.toFixed(2)}</td>
                <td class="px-4 py-3 border-b font-bold">৳${laborCost.toFixed(2)}</td>
            `;
            laborTbody.appendChild(row);
        }
    });

    products.forEach(product => {
        const unloadingCost = parseFloat(product.labor_cost || 0);
        if (unloadingCost > 0) {
            hasLaborData = true;
            grandTotalLabor += unloadingCost;
            const row = document.createElement('tr');
            row.className = "hover:bg-gray-50 text-sm text-gray-700";
            const prodDate = new Date(product.created_at).toLocaleDateString('bn-BD');
            
            row.innerHTML = `
                <td class="px-4 py-3 border-b">${prodDate}</td>
                <td class="px-4 py-3 border-b text-purple-600 font-medium">মালামাল আনলোডিং: ${product.product_name}</td>
                <td class="px-4 py-3 border-b">৳${unloadingCost.toFixed(2)}</td>
                <td class="px-4 py-3 border-b font-bold">৳${unloadingCost.toFixed(2)}</td>
            `;
            laborTbody.appendChild(row);
        }
    });

    if (hasLaborData) {
        const totalRow = document.createElement('tr');
        totalRow.className = "bg-gray-100 font-bold";
        totalRow.innerHTML = `
            <td colspan="3" class="px-4 py-3 text-right">সর্বমোট লেবার খরচ:</td>
            <td class="px-4 py-3 text-red-600">৳${grandTotalLabor.toFixed(2)}</td>
        `;
        laborTbody.appendChild(totalRow);
    } else {
        laborTbody.innerHTML = `<tr><td colspan="4" class="px-4 py-3 text-center text-gray-500">আজকের কোনো লেবার খরচ নেই</td></tr>`;
    }
}

module.exports = { renderDailyReports, renderLaborReports };