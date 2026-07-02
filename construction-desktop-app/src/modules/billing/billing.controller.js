// calculation.js
const { getCart } = require('./cart');
const { BillingService } = require('./billing.service');

function calculateBillSummary() {
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTotalPayable = document.getElementById('summary-total-payable');
    const summaryCashPaid = document.getElementById('summary-cash-paid');
    const summaryCalculatedDue = document.getElementById('summary-calculated-due');

    const summaryLaborCost = document.getElementById('summary-labor-cost');
    const summaryLaborBearer = document.getElementById('summary-labor-bearer');
    const summaryTransportCost = document.getElementById('summary-transport-cost');
    const summaryTransportBearer = document.getElementById('summary-transport-bearer');

    if (!summarySubtotal) return;

    // ১. ডাটা সংগ্রহ (Data Gathering)
    const cart = getCart();
    const laborData = {
        cost: parseFloat(summaryLaborCost?.value || 0) || 0,
        bearer: summaryLaborBearer?.value || 'none'
    };
    const transportData = {
        cost: parseFloat(summaryTransportCost?.value || 0) || 0,
        bearer: summaryTransportBearer?.value || 'none'
    };
    const cashPaid = parseFloat(summaryCashPaid?.value || 0) || 0;

    // ২. সার্ভিস কল (Logic Execution)
    const summary = BillingService.calculateBillSummary(cart, laborData, transportData, cashPaid);

    // ৩. UI আপডেট (Rendering)
    if (summarySubtotal) summarySubtotal.innerText = summary.subtotal.toFixed(2);
    if (summaryTotalPayable) summaryTotalPayable.innerText = summary.totalPayable.toFixed(2);
    if (summaryCalculatedDue) summaryCalculatedDue.innerText = summary.due.toFixed(2);
}

window.calculateBillSummary = calculateBillSummary; 

module.exports = { calculateBillSummary };