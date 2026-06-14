// const { supabase } = require('../config/supabaseClient');
// async function fetchDailyReports() {
//     const reportSalesTbody = document.getElementById('report-sales-tbody');
//     try {
//         const todayStart = new Date();
//         todayStart.setHours(0,0,0,0);

//         let { data: sales, error } = await supabase
//             .from('sales')
//             .select('*')
//             .gte('created_at', todayStart.toISOString())
//             .order('created_at', { ascending: false });

//         if (error) throw error;

//         let totalSales = 0;
//         let cashReceived = 0;
//         let totalDue = 0;
//         let netProfit = 0; 

//         if (reportSalesTbody) reportSalesTbody.innerHTML = '';

//         sales.forEach(sale => {
//             totalSales += sale.total_payable;
//             cashReceived += sale.cash_paid;
//             totalDue += sale.due_amount;
//             netProfit += (sale.subtotal * 0.15); // আনুমানিক ১৫% লাভ মার্জিন

//             if (reportSalesTbody) {
//                 const row = document.createElement('tr');
//                 const saleDate = new Date(sale.created_at).toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'});
                
//                 row.innerHTML = `
//                     <td class="px-4 py-2 border-b">${saleDate}</td>
//                     <td class="px-4 py-2 border-b font-semibold">৳${sale.total_payable.toFixed(2)}</td>
//                     <td class="px-4 py-2 border-b text-green-600">৳${sale.cash_paid.toFixed(2)}</td>
//                     <td class="px-4 py-2 border-b text-red-600 font-bold">৳${sale.due_amount.toFixed(2)}</td>
//                 `;
//                 reportSalesTbody.appendChild(row);
//             }
//         });

//         if(document.getElementById('rep-total-sales')) document.getElementById('rep-total-sales').innerText = totalSales.toFixed(2);
//         if(document.getElementById('rep-cash-received')) document.getElementById('rep-cash-received').innerText = cashReceived.toFixed(2);
//         if(document.getElementById('rep-total-due')) document.getElementById('rep-total-due').innerText = totalDue.toFixed(2);
//         if(document.getElementById('rep-net-profit')) document.getElementById('rep-net-profit').innerText = netProfit.toFixed(2);

//     } catch (err) {
//         console.error("Report loading failed:", err.message);
//     }
// }

// module.exports = { fetchDailyReports };