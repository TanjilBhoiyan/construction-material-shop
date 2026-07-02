// checkout.js
const { BillingService } = require('./billing.service');
const { getCart, setCart, renderCart } = require('./cart');
const { calculateBillSummary } = require('./billing.controller');

async function handleCheckout(checkoutBillBtn) {
    const { showToast, populateBillingDropdown } = require('./index');
    const cart = getCart();

    if (cart.length === 0) {
        showToast("কার্ট খালি! দয়া করে অন্তত একটি প্রোডাক্ট যোগ করুন।", true);
        return;
    }

    // ডম থেকে ডাটা সংগ্রহ
    const customerData = {
        name: document.getElementById('bill-cust-name')?.value.trim() || "অনিবন্ধিত কাস্টমার",
        phone: document.getElementById('bill-cust-phone')?.value.trim() || "",
        father_name: document.getElementById('customer-father')?.value.trim() || "",
        customer_address: document.getElementById('customer-address')?.value.trim() || ""
    };

    const saleData = {
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        father_name: customerData.father_name,
        customer_address: customerData.customer_address,
        subtotal: parseFloat(document.getElementById('summary-subtotal')?.innerText || 0),
        labor_cost: parseFloat(document.getElementById('summary-labor-cost')?.value || 0),
        labor_bearer: document.getElementById('summary-labor-bearer')?.value || 'none',
        carrying_cost: parseFloat(document.getElementById('summary-transport-cost')?.value || 0),
        carrying_bearer: document.getElementById('summary-transport-bearer')?.value || 'none',
        total_payable: parseFloat(document.getElementById('summary-total-payable')?.innerText || 0),
        cash_paid: parseFloat(document.getElementById('summary-cash-paid')?.value || 0),
        due_amount: parseFloat(document.getElementById('summary-calculated-due')?.innerText || 0)
    };

    if (checkoutBillBtn) {
        checkoutBillBtn.disabled = true;
        checkoutBillBtn.innerText = "⏳ প্রসেস হচ্ছে...";
        checkoutBillBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    try {
        // সার্ভিস লেয়ারের মাধ্যমে সেল সম্পন্ন করা
        await BillingService.finalizeSale(saleData, cart, customerData);

        showToast("🎉 বিল এবং মালের তালিকা সফলভাবে সংরক্ষিত হয়েছে!");

        // রিসেট লজিক
        setCart([]);
        renderCart();
        
        // ফিল্ড রিসেট
        if(document.getElementById('bill-cust-name')) document.getElementById('bill-cust-name').value = '';
        if(document.getElementById('bill-cust-phone')) document.getElementById('bill-cust-phone').value = '';
        if(document.getElementById('customer-father')) document.getElementById('customer-father').value = ''; 
        if(document.getElementById('customer-address')) document.getElementById('customer-address').value = ''; 
        if(document.getElementById('summary-labor-cost')) document.getElementById('summary-labor-cost').value = 0;
        if(document.getElementById('summary-cash-paid')) document.getElementById('summary-cash-paid').value = 0;
        
        calculateBillSummary();
        if (typeof window.fetchProducts === 'function') window.fetchProducts();
        populateBillingDropdown();

        setTimeout(() => {
            window.focus();
            document.getElementById('bill-cust-name')?.focus();
        }, 50);

    } catch (err) {
        showToast("সমস্যা হয়েছে: " + err.message, true);
    } finally {
        if (checkoutBillBtn) {
            checkoutBillBtn.disabled = false;
            checkoutBillBtn.innerHTML = "💾 ইনভয়েস কনফার্ম ও প্রিন্ট";
            checkoutBillBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

window.handleCheckout = handleCheckout; // গ্লোবাল এক্সেসের জন্য
module.exports = { handleCheckout };