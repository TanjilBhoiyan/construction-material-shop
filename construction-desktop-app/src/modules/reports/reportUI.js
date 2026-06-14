function renderDailyReports(sales) {
    const reportSalesTbody = document.getElementById('report-sales-tbody');
    
    let totalSales = 0;
    let cashReceived = 0;
    let totalDue = 0;
    let netProfit = 0; 

    if (reportSalesTbody) reportSalesTbody.innerHTML = '';

    sales.forEach(sale => {
        totalSales += sale.total_payable || 0;
        cashReceived += sale.cash_paid || 0;
        totalDue += sale.due_amount || 0;
        netProfit += ((sale.subtotal || 0) * 0.15); 

        if (reportSalesTbody) {
            const row = document.createElement('tr');
            row.className = "hover:bg-gray-50 text-sm text-gray-700";
            
            // 📅 🆕 তারিখ ও সময় একসাথে ফরম্যাট করা (যেমন: ১৪/০৬/২০২৬, ১০:৫২ PM)
            const saleDateTime = new Date(sale.created_at).toLocaleString('bn-BD', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
            });

            // বাবার নাম হ্যান্ডেলিং
            let fatherNameStr = '';
            if (sale.father_name && sale.father_name.trim() !== '' && sale.father_name !== 'EMPTY') {
                fatherNameStr = `<div class="text-xs text-gray-500 font-normal mt-0.5">পিতা: ${sale.father_name}</div>`;
            }

            // মোবাইল নম্বর হ্যান্ডেলিং
            const custPhone = sale.customer_phone && sale.customer_phone !== 'EMPTY' && sale.customer_phone.trim() !== '' ? sale.customer_phone : '—';
            
            // ঠিকানা হ্যান্ডেলিং
            const custAddress = sale.customer_address && sale.customer_address !== 'EMPTY' && sale.customer_address.trim() !== '' ? sale.customer_address : '—';
            
            const dueColor = sale.due_amount > 0 ? 'text-red-600 font-bold' : 'text-gray-500';

            row.innerHTML = `
                <td class="px-4 py-3 border-b text-gray-600">${saleDateTime}</td> <!-- 🔥 এখানে এখন তারিখ ও সময় দুইটাই দেখাবে -->
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

    // সামারি কার্ড আপডেট
    const repTotalSales = document.getElementById('rep-total-sales');
    const repCashReceived = document.getElementById('rep-cash-received');
    const repTotalDue = document.getElementById('rep-total-due');
    const repNetProfit = document.getElementById('rep-net-profit');

    if (repTotalSales) repTotalSales.innerText = totalSales.toFixed(2);
    if (repCashReceived) repCashReceived.innerText = cashReceived.toFixed(2);
    if (repTotalDue) repTotalDue.innerText = totalDue.toFixed(2);
    if (repNetProfit) repNetProfit.innerText = netProfit.toFixed(2);
}

module.exports = { renderDailyReports };