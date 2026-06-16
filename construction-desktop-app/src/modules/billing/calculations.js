// ==========================================
// 🧮 2. REAL-TIME BILLING CALCULATIONS
// ==========================================

const { getCart } = require('./cart');

function calculateBillSummary() {
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTotalPayable = document.getElementById('summary-total-payable');
    const summaryCashPaid = document.getElementById('summary-cash-paid');
    const summaryCalculatedDue = document.getElementById('summary-calculated-due');

    // 🎯 নতুন লেবার এবং পরিবহন সংক্রান্ত ইনপুট ও ড্রপডাউন এলিমেন্টগুলো ধরা হলো
    const summaryLaborCost = document.getElementById('summary-labor-cost');
    const summaryLaborBearer = document.getElementById('summary-labor-bearer');
    const summaryTransportCost = document.getElementById('summary-transport-cost');
    const summaryTransportBearer = document.getElementById('summary-transport-bearer');

    if (!summarySubtotal) return;

    // ১. মালের বেস প্রাইস (Subtotal) হিসাব করা
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    summarySubtotal.innerText = subtotal.toFixed(2);

    // ২. লেবার ও গাড়ি ভাড়ার ভ্যালু এবং কে বহন করছে তা রিড করা
    const laborCost = parseFloat(summaryLaborCost ? summaryLaborCost.value : 0) || 0;
    const laborBearer = summaryLaborBearer ? summaryLaborBearer.value : 'none';

    const transportCost = parseFloat(summaryTransportCost ? summaryTransportCost.value : 0) || 0;
    const transportBearer = summaryTransportBearer ? summaryTransportBearer.value : 'none';

    // ৩. 🎯 নতুন বিজনেস লজিক অনুযায়ী সর্বমোট বিল (Payable) ক্যালকুলেট করা
    let totalPayable = subtotal;

    // কন্ডিশন ১: লেবার খরচ যদি কাস্টমার দেয়, তবে বিলের সাথে যোগ হবে
    if (laborBearer === 'customer') {
        totalPayable += laborCost;
    }

    // কন্ডিশন ২: গাড়ি ভাড়া যদি কাস্টমার দেয়, তবে বিলের সাথে যোগ হবে
    if (transportBearer === 'customer') {
        totalPayable += transportCost;
    }

    // সর্বমোট বিল স্ক্রিনে আপডেট করা
    if (summaryTotalPayable) summaryTotalPayable.innerText = totalPayable.toFixed(2);

    // ৪. আজকের বাকি (Due) হিসাব করা
    const cashPaid = parseFloat(summaryCashPaid ? summaryCashPaid.value : 0) || 0;
    const due = totalPayable - cashPaid;
    if (summaryCalculatedDue) summaryCalculatedDue.innerText = due.toFixed(2);
}

module.exports = { calculateBillSummary };