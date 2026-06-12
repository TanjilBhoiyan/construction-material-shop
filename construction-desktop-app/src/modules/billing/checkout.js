// ==========================================
// 💵 3. INVOICE CHECKOUT & SUPABASE SYNC
// ==========================================

const { supabase } = require('../../config/supabaseClient');
const { getCart, setCart, renderCart } = require('./cart');
const { calculateBillSummary } = require('./calculations');

async function handleCheckout(checkoutBillBtn) {
    const cart = getCart();
    const { showToast, populateBillingDropdown } = require('./index');

    if (cart.length === 0) {
        showToast("কার্ট খালি! দয়া করে অন্তত একটি প্রোডাক্ট যোগ করুন।", true);
        return;
    }

    // ১. ডম থেকে নতুন ইনপুটগুলোর ভ্যালু নেওয়া
    const customerName = document.getElementById('customer-name')?.value.trim() || "অনিবন্ধিত কাস্টমার";
    const customerPhone = document.getElementById('customer-phone')?.value.trim() || "";
    const fatherName = document.getElementById('customer-father')?.value.trim() || ""; // 👈 নতুন
    const customerAddress = document.getElementById('customer-address')?.value.trim() || ""; // 👈 নতুন
    
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryExtraCost = document.getElementById('summary-extra-cost');
    const summaryCostBearer = document.getElementById('summary-cost-bearer');
    const summaryTotalPayable = document.getElementById('summary-total-payable');
    const summaryCashPaid = document.getElementById('summary-cash-paid');
    const summaryCalculatedDue = document.getElementById('summary-calculated-due');

    const extraCost = parseFloat(summaryExtraCost ? summaryExtraCost.value : 0) || 0;
    const bearer = summaryCostBearer ? summaryCostBearer.value : 'none';
    const subtotal = parseFloat(summarySubtotal ? summarySubtotal.innerText : 0) || 0;
    const totalPayable = parseFloat(summaryTotalPayable ? summaryTotalPayable.innerText : 0) || 0;
    const cashPaid = parseFloat(summaryCashPaid ? summaryCashPaid.value : 0) || 0;
    const due = parseFloat(summaryCalculatedDue ? summaryCalculatedDue.innerText : 0) || 0;

    // ⏳ সাবমিট বাটন লক করা (ডাবল ক্লিক আটকাতে)
    if (checkoutBillBtn) {
        checkoutBillBtn.disabled = true;
        checkoutBillBtn.innerText = "⏳ প্রসেস হচ্ছে...";
        checkoutBillBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    try {
        // ১. প্রোডাক্টের স্টক চেক ও মাইনাস লজিক
        for (const item of cart) {
            let { data: currentProd, error: fetchErr } = await supabase
                .from('products')
                .select('current_stock')
                .eq('id', item.product_id)
                .single();

            if (fetchErr) throw fetchErr;

            if (currentProd.current_stock < item.quantity) {
                showToast(`দুঃখিত! ${item.name}-এর পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${currentProd.current_stock}`, true);
                return;
            }

            const updatedStock = currentProd.current_stock - item.quantity;
            let { error: updateErr } = await supabase
                .from('products')
                .update({ current_stock: updatedStock })
                .eq('id', item.product_id);

            if (updateErr) throw updateErr;
        }

        // ২. কাস্টমার লেজার সিঙ্ক লজিক
        if (customerPhone !== "") {
            let { data: existingCustomer, error: custFetchErr } = await supabase
                .from('customers')
                .select('*')
                .eq('phone', customerPhone)
                .maybeSingle();

            if (custFetchErr) throw custFetchErr;

            if (existingCustomer) {
                const newTotalDue = existingCustomer.total_due + due;
                let { error: custUpdateErr } = await supabase
                    .from('customers')
                    .update({ total_due: newTotalDue, name: customerName }) 
                    .eq('id', existingCustomer.id);

                if (custUpdateErr) throw custUpdateErr;
            } else {
                let { error: custInsertErr } = await supabase
                    .from('customers')
                    .insert([{ name: customerName, phone: customerPhone, total_due: due }]);

                if (custInsertErr) throw custInsertErr;
            }
        }

        // ৩. sales টেবিলে মেমো সেভ করা
        const { error: saleErr } = await supabase
            .from('sales')
            .insert([
                {
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    father_name: fatherName,
                    customer_address: customerAddress,
                    subtotal: subtotal,
                    extra_cost: extraCost,
                    cost_bearer: bearer,
                    total_payable: totalPayable,
                    cash_paid: cashPaid,
                    due_amount: due
                }
            ]);

        if (saleErr) throw saleErr;

        // 🎯 টোস্ট মেসেজ শো
        showToast("🎉 বিল সফলভাবে সংরক্ষিত হয়েছে এবং কাস্টমার লেজার আপডেট হয়েছে!");

        // ৪. ফর্ম ও কার্ট রিসেট সাইকেল
        setCart([]);
        renderCart();
        
        if(document.getElementById('bill-cust-name')) document.getElementById('bill-cust-name').value = '';
        if(document.getElementById('bill-cust-phone')) document.getElementById('bill-cust-phone').value = '';
        if(summaryExtraCost) summaryExtraCost.value = 0;
        if(summaryCostBearer) summaryCostBearer.value = 'none';
        if(summaryCashPaid) summaryCashPaid.value = 0;
        
        calculateBillSummary();

        // ইনভেন্টরি ও ড্রপডাউন রিফ্রেশ
        if (typeof window.fetchProducts === 'function') window.fetchProducts();
        populateBillingDropdown();

        // 🎯 মাউস লক খোলার চূড়ান্ত ট্রিক
        setTimeout(() => {
            window.focus();
            const nameInput = document.getElementById('bill-cust-name');
            if (nameInput) nameInput.focus();
        }, 50);

    } catch (err) {
        showToast("সমস্যা হয়েছে: " + err.message, true);
    } finally {
        // 🔓 কাজ শেষে বাটন আবার আনলক ও নরমাল করা
        if (checkoutBillBtn) {
            checkoutBillBtn.disabled = false;
            checkoutBillBtn.innerHTML = "💾 ইনভয়েস কনফার্ম ও প্রিন্ট";
            checkoutBillBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

module.exports = { handleCheckout };