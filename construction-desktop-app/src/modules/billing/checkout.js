// ==========================================
// 💵 3. INVOICE CHECKOUT & SUPABASE SYNC
// ==========================================

const { BillingRepository } = require('./billing.repository'); // রিপোজিটরি ইমপোর্ট
const { getCart, setCart, renderCart } = require('./cart');
const { calculateBillSummary } = require('./calculations');

async function handleCheckout(checkoutBillBtn) {
    const cart = getCart();
    const { showToast, populateBillingDropdown } = require('./index');

    if (cart.length === 0) {
        showToast("কার্ট খালি! দয়া করে অন্তত একটি প্রোডাক্ট যোগ করুন।", true);
        return;
    }

    // ডম থেকে ভ্যালু নেওয়া
    const customerName = document.getElementById('bill-cust-name')?.value.trim() || "অনিবন্ধিত কাস্টমার";
    const customerPhone = document.getElementById('bill-cust-phone')?.value.trim() || "";
    const fatherName = document.getElementById('customer-father')?.value.trim() || ""; 
    const customerAddress = document.getElementById('customer-address')?.value.trim() || ""; 
    
    const summaryLaborCost = document.getElementById('summary-labor-cost');
    const summaryLaborBearer = document.getElementById('summary-labor-bearer');
    const summaryTransportCost = document.getElementById('summary-transport-cost');
    const summaryTransportBearer = document.getElementById('summary-transport-bearer');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTotalPayable = document.getElementById('summary-total-payable');
    const summaryCashPaid = document.getElementById('summary-cash-paid');
    const summaryCalculatedDue = document.getElementById('summary-calculated-due');

    const laborCost = parseFloat(summaryLaborCost ? summaryLaborCost.value : 0) || 0;
    const laborBearer = summaryLaborBearer ? summaryLaborBearer.value : 'none';
    const transportCost = parseFloat(summaryTransportCost ? summaryTransportCost.value : 0) || 0;
    const transportBearer = summaryTransportBearer ? summaryTransportBearer.value : 'none';

    const subtotal = parseFloat(summarySubtotal ? summarySubtotal.innerText : 0) || 0;
    const totalPayable = parseFloat(summaryTotalPayable ? summaryTotalPayable.innerText : 0) || 0;
    const cashPaid = parseFloat(summaryCashPaid ? summaryCashPaid.value : 0) || 0;
    const due = parseFloat(summaryCalculatedDue ? summaryCalculatedDue.innerText : 0) || 0;

    if (checkoutBillBtn) {
        checkoutBillBtn.disabled = true;
        checkoutBillBtn.innerText = "⏳ প্রসেস হচ্ছে...";
        checkoutBillBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    try {
        // ১. প্রোডাক্টের স্টক চেক ও আপডেট (Repository Call)
        for (const item of cart) {
            const { data: currentProd, error: fetchErr } = await BillingRepository.getProductStock(item.product_id);
            if (fetchErr) throw fetchErr;

            if (currentProd.current_stock < item.quantity) {
                showToast(`দুঃখিত! ${item.name}-এর পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${currentProd.current_stock}`, true);
                if (checkoutBillBtn) {
                    checkoutBillBtn.disabled = false;
                    checkoutBillBtn.innerHTML = "💾 ইনভয়েস কনফার্ম ও প্রিন্ট";
                    checkoutBillBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
                return;
            }

            const { error: updateErr } = await BillingRepository.updateProductStock(item.product_id, currentProd.current_stock - item.quantity);
            if (updateErr) throw updateErr;
        }

        // ২. কাস্টমার লেজার সিঙ্ক (Repository Call)
        if (customerName !== "অনিবন্ধিত কাস্টমার" && customerName !== "") {
            const { data: existingCustomer, error: custFetchErr } = await BillingRepository.getCustomer(customerPhone, customerName);
            if (custFetchErr) throw custFetchErr;

            if (existingCustomer) {
                await BillingRepository.updateCustomer(existingCustomer.id, { 
                    total_due: existingCustomer.total_due + due, 
                    name: customerName,
                    father_name: fatherName || existingCustomer.father_name,
                    customer_address: customerAddress || existingCustomer.customer_address
                });
            } else {
                await BillingRepository.insertCustomer({ 
                    name: customerName, 
                    phone: customerPhone === "" ? null : customerPhone, 
                    father_name: fatherName === "" ? null : fatherName, 
                    customer_address: customerAddress === "" ? null : customerAddress, 
                    total_due: Number(due) 
                });
            }
        }

        // ৩. সেলস সেভ করা (Repository Call)
        const { data: savedSale, error: saleErr } = await BillingRepository.saveSale({
            customer_name: customerName,
            customer_phone: customerPhone,
            father_name: fatherName,
            customer_address: customerAddress,
            subtotal: subtotal,
            labor_cost: laborCost,
            labor_bearer: laborBearer,
            carrying_cost: transportCost,
            carrying_bearer: transportBearer,
            total_payable: totalPayable,
            cash_paid: cashPaid,
            due_amount: due
        });
        if (saleErr) throw saleErr;

        // ৪. সেল আইটেম সেভ করা (Repository Call)
        const itemsToInsert = cart.map(item => ({
            sale_id: savedSale[0].id,
            product_id: item.product_id,
            quantity: parseFloat(item.quantity) || 0,
            price_per_unit: parseFloat(item.price_per_unit) || 0,
            total_price: parseFloat(item.total_price) || 0
        }));
        await BillingRepository.saveSaleItems(itemsToInsert);

        showToast("🎉 বিল এবং মালের তালিকা সফলভাবে সংরক্ষিত হয়েছে!");

        // ৫. রিসেট লজিক
        setCart([]);
        renderCart();
        
        if(document.getElementById('bill-cust-name')) document.getElementById('bill-cust-name').value = '';
        if(document.getElementById('bill-cust-phone')) document.getElementById('bill-cust-phone').value = '';
        if(document.getElementById('customer-father')) document.getElementById('customer-father').value = ''; 
        if(document.getElementById('customer-address')) document.getElementById('customer-address').value = ''; 
        if(summaryLaborCost) summaryLaborCost.value = 0;
        if(summaryLaborBearer) summaryLaborBearer.value = 'none';
        if(summaryTransportCost) summaryTransportCost.value = 0;
        if(summaryTransportBearer) summaryTransportBearer.value = 'none';
        if(summaryCashPaid) summaryCashPaid.value = 0;
        
        calculateBillSummary();
        if (typeof window.fetchProducts === 'function') window.fetchProducts();
        populateBillingDropdown();

        setTimeout(() => {
            window.focus();
            const nameInput = document.getElementById('bill-cust-name');
            if (nameInput) nameInput.focus();
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

module.exports = { handleCheckout };