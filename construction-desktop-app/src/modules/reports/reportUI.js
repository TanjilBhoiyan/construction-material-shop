function renderDailyReports(sales, products = []) {
    const reportSalesTbody = document.getElementById('report-sales-tbody');
    
    let totalSales = 0;
    let cashReceived = 0;
    let totalDue = 0;
    let netProfit = 0; 
    let totalLaborCost = 0; 

    if (reportSalesTbody) reportSalesTbody.innerHTML = '';

    // 💰 সেলস টেবিলের হিসাব
    sales.forEach(sale => {
        totalSales += sale.total_payable || 0;
        cashReceived += sale.cash_paid || 0;
        totalDue += sale.due_amount || 0;
        netProfit += ((sale.subtotal || 0) * 0.15); 
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

    // 📦 আপডেট: inventory_logs টেবিল থেকে লেবার খরচ যোগ করা হচ্ছে
    products.forEach(product => {
        // পুরনো unloading_labor_cost এর বদলে এখন labor_cost
        totalLaborCost += parseFloat(product.labor_cost || 0);
    });

    // সামারি কার্ড আপডেট
    const repTotalSales = document.getElementById('rep-total-sales');
    const repCashReceived = document.getElementById('rep-cash-received');
    const repTotalDue = document.getElementById('rep-total-due');
    const repNetProfit = document.getElementById('rep-net-profit');
    const repLaborCost = document.getElementById('rep-labor-cost');

    if (repTotalSales) repTotalSales.innerText = totalSales.toFixed(2);
    if (repCashReceived) repCashReceived.innerText = cashReceived.toFixed(2);
    if (repTotalDue) repTotalDue.innerText = totalDue.toFixed(2);
    if (repNetProfit) repNetProfit.innerText = netProfit.toFixed(2);
    if (repLaborCost) repLaborCost.innerText = totalLaborCost.toFixed(2);
}

// 🚚 লেবার খতিয়ানের টেবিলে ডাটা দেখানোর ফাংশন (Sales + Products)
function renderLaborReports(sales, products = []) {
    const laborTbody = document.querySelector('#labor-ledger-sub-screen tbody');
    if (!laborTbody) return;

    laborTbody.innerHTML = ''; 
    let hasLaborData = false;

    // ১. সেলস থেকে লেবার খরচ প্রিন্ট
    sales.forEach(sale => {
        const laborCost = parseFloat(sale.labor_cost || 0);
        if (laborCost > 0) {
            hasLaborData = true;
            const row = document.createElement('tr');
            row.className = "hover:bg-gray-50 text-sm text-gray-700";

            const saleDate = new Date(sale.created_at).toLocaleDateString('bn-BD', {
                year: 'numeric', month: '2-digit', day: '2-digit'
            });

            const customerName = sale.customer_name && sale.customer_name !== 'EMPTY' ? sale.customer_name : 'অনিবন্ধিত কাস্টমার';

            row.innerHTML = `
                <td class="px-4 py-3 border-b">${saleDate}</td>
                <td class="px-4 py-3 border-b text-blue-600 font-medium">পণ্য বিক্রি (কাস্টমার: ${customerName})</td>
                <td class="px-4 py-3 border-b">৳${laborCost.toFixed(2)}</td>
                <td class="px-4 py-3 border-b font-bold">৳${laborCost.toFixed(2)}</td>
            `;
            laborTbody.appendChild(row);
        }
    });

    // ২. আপডেট: inventory_logs থেকে আনলোডিং খরচ প্রিন্ট
    products.forEach(product => {
        // পুরনো unloading_labor_cost এর বদলে এখন labor_cost
        const unloadingCost = parseFloat(product.labor_cost || 0);
        if (unloadingCost > 0) {
            hasLaborData = true;
            const row = document.createElement('tr');
            row.className = "hover:bg-gray-50 text-sm text-gray-700";

            const prodDate = new Date(product.created_at).toLocaleDateString('bn-BD', {
                year: 'numeric', month: '2-digit', day: '2-digit'
            });

            // পুরনো product.name এর বদলে এখন product.product_name
            row.innerHTML = `
                <td class="px-4 py-3 border-b">${prodDate}</td>
                <td class="px-4 py-3 border-b text-purple-600 font-medium">মালামাল আনলোডিং: ${product.product_name}</td>
                <td class="px-4 py-3 border-b">৳${unloadingCost.toFixed(2)}</td>
                <td class="px-4 py-3 border-b font-bold">৳${unloadingCost.toFixed(2)}</td>
            `;
            laborTbody.appendChild(row);
        }
    });

    // যদি কোনো লেবার খরচ না থাকে
    if (!hasLaborData) {
        laborTbody.innerHTML = `
            <tr>
                <td colspan="4" class="px-4 py-3 border-b text-center text-gray-500 py-6">
                    আজকের কোনো লেবার খরচ নেই
                </td>
            </tr>
        `;
    }
}

module.exports = { renderDailyReports, renderLaborReports };