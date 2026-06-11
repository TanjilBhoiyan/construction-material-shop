// ==========================================
// 🧮 2. REAL-TIME BILLING CALCULATIONS
// ==========================================

const { getCart } = require('./cart');

function calculateBillSummary() {
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryExtraCost = document.getElementById('summary-extra-cost');
    const summaryCostBearer = document.getElementById('summary-cost-bearer');
    const summaryTotalPayable = document.getElementById('summary-total-payable');
    const summaryCashPaid = document.getElementById('summary-cash-paid');
    const summaryCalculatedDue = document.getElementById('summary-calculated-due');

    if (!summarySubtotal) return;

    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    summarySubtotal.innerText = subtotal.toFixed(2);

    const extraCost = parseFloat(summaryExtraCost ? summaryExtraCost.value : 0) || 0;
    const bearer = summaryCostBearer ? summaryCostBearer.value : 'none';

    let totalPayable = subtotal;
    if (bearer === 'customer') {
        totalPayable += extraCost;
    }

    if (summaryTotalPayable) summaryTotalPayable.innerText = totalPayable.toFixed(2);

    const cashPaid = parseFloat(summaryCashPaid ? summaryCashPaid.value : 0) || 0;
    const due = totalPayable - cashPaid;
    if (summaryCalculatedDue) summaryCalculatedDue.innerText = due.toFixed(2);
}

module.exports = { calculateBillSummary };