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

    // ১. ডম থেকে কাস্টমারের ভ্যালু নেওয়া
    const customerName = document.getElementById('bill-cust-name')?.value.trim() || "অনিবন্ধিত কাস্টমার";
    const customerPhone = document.getElementById('bill-cust-phone')?.value.trim() || "";
    const fatherName = document.getElementById('customer-father')?.value.trim() || ""; 
    const customerAddress = document.getElementById('customer-address')?.value.trim() || ""; 
    
    // 🎯 নতুন ৪টি লেবার এবং পরিবহন সংক্রান্ত ইনপুট ও ড্রপডাউন এলিমেন্টগুলো রিড করা
    const summaryLaborCost = document.getElementById('summary-labor-cost');
    const summaryLaborBearer = document.getElementById('summary-labor-bearer');
    const summaryTransportCost = document.getElementById('summary-transport-cost');
    const summaryTransportBearer = document.getElementById('summary-transport-bearer');

    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTotalPayable = document.getElementById('summary-total-payable');
    const summaryCashPaid = document.getElementById('summary-cash-paid');
    const summaryCalculatedDue = document.getElementById('summary-calculated-due');

    // 🎯 নতুন ভ্যালুগুলোকে পার্স করে ভ্যারিয়েবলে নেওয়া
    const laborCost = parseFloat(summaryLaborCost ? summaryLaborCost.value : 0) || 0;
    const laborBearer = summaryLaborBearer ? summaryLaborBearer.value : 'none';
    const transportCost = parseFloat(summaryTransportCost ? summaryTransportCost.value : 0) || 0;
    const transportBearer = summaryTransportBearer ? summaryTransportBearer.value : 'none';

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
                
                // স্টক না থাকলে বাটন আনলক করে ফিরে যাওয়া
                if (checkoutBillBtn) {
                    checkoutBillBtn.disabled = false;
                    checkoutBillBtn.innerHTML = "💾 ইনভয়েস কনফার্ম ও প্রিন্ট";
                    checkoutBillBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
                return;
            }

            const updatedStock = currentProd.current_stock - item.quantity;
            let { error: updateErr } = await supabase
                .from('products')
                .update({ current_stock: updatedStock })
                .eq('id', item.product_id);

            if (updateErr) throw updateErr;
        }

        // ==========================================================
        // ২. কাস্টমার লেজার সিঙ্ক লজিক (মোবাইল নাম্বার থাক বা না থাক)
        // ==========================================================
        if (customerName !== "অনিবন্ধিত কাস্টমার" && customerName !== "") {
            let existingCustomer = null;
            let custFetchErr = null;

            if (customerPhone !== "") {
                let { data: resData, error: err } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('phone', customerPhone)
                    .maybeSingle();
                existingCustomer = resData;
                custFetchErr = err;
            } else {
                let { data: resData, error: err } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('name', customerName)
                    .maybeSingle();
                existingCustomer = resData;
                custFetchErr = err;
            }

            if (custFetchErr) throw custFetchErr;

            if (existingCustomer) {
                const newTotalDue = existingCustomer.total_due + due;
                let { error: custUpdateErr } = await supabase
                    .from('customers')
                    .update({ 
                        total_due: newTotalDue, 
                        name: customerName,
                        father_name: fatherName || existingCustomer.father_name,
                        customer_address: customerAddress || existingCustomer.customer_address
                    }) 
                    .eq('id', existingCustomer.id);

                if (custUpdateErr) throw custUpdateErr;
            } else {
                let { error: custInsertErr } = await supabase
                    .from('customers')
                    .insert([{ 
                        name: customerName, 
                        phone: customerPhone === "" ? null : customerPhone, 
                        father_name: fatherName === "" ? null : fatherName, 
                        customer_address: customerAddress === "" ? null : customerAddress, 
                        total_due: Number(due) 
                    }]);

                if (custInsertErr) throw custInsertErr;
            }
        }

        // ==========================================================
        // ৩. sales টেবিলে মেমো সেভ করা এবং নতুন ID জেনারেট করা
        // ==========================================================
        const { data: savedSale, error: saleErr } = await supabase
            .from('sales')
            .insert([
                {
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    father_name: fatherName,
                    customer_address: customerAddress,
                    subtotal: subtotal,
                    // 🎯 পুরাতন extra_cost এবং cost_bearer এর জায়গায় নতুন ৪টি সুপাবেজ কলাম ম্যাপ করা হয়েছে
                    labor_cost: laborCost,
                    labor_bearer: laborBearer,
                    carrying_cost: transportCost,
                    carrying_bearer: transportBearer,
                    total_payable: totalPayable,
                    cash_paid: cashPaid,
                    due_amount: due
                }
            ])
            .select();

        if (saleErr) throw saleErr;

        // নতুন তৈরি হওয়া সেলস/মেমো এর ইউনিক আইডি
        const newSaleId = savedSale[0].id;

        // ==========================================================
        // ৪. sale_items টেবিলে কার্টের আইটেমগুলো সেভ করা
        // ==========================================================
        if (cart && cart.length > 0) {
            const itemsToInsert = cart.map(item => ({
                sale_id: newSaleId,                                     
                product_id: item.product_id,                            
                quantity: parseFloat(item.quantity) || 0,                
                price_per_unit: parseFloat(item.price_per_unit) || 0,   
                total_price: parseFloat(item.total_price) || 0          
            }));

            const { error: itemsInsertErr } = await supabase
                .from('sale_items')
                .insert(itemsToInsert);

            if (itemsInsertErr) throw itemsInsertErr;
        }

        // 🎯 টোস্ট মেসেজ শো
        showToast("🎉 বিল এবং মালের তালিকা সফলভাবে সংরক্ষিত হয়েছে!");

        // ৫. ফর্ম ও কার্ট রিসেট সাইকেল
        setCart([]);
        renderCart();
        
        if(document.getElementById('bill-cust-name')) document.getElementById('bill-cust-name').value = '';
        if(document.getElementById('bill-cust-phone')) document.getElementById('bill-cust-phone').value = '';
        if(document.getElementById('customer-father')) document.getElementById('customer-father').value = ''; 
        if(document.getElementById('customer-address')) document.getElementById('customer-address').value = ''; 
        
        // 🎯 ফর্ম রিসেটে নতুন ৪টি অতিরিক্ত খরচ ফিল্ড ডিফল্ট করে দেওয়া
        if(summaryLaborCost) summaryLaborCost.value = 0;
        if(summaryLaborBearer) summaryLaborBearer.value = 'none';
        if(summaryTransportCost) summaryTransportCost.value = 0;
        if(summaryTransportBearer) summaryTransportBearer.value = 'none';
        
        if(summaryCashPaid) summaryCashPaid.value = 0;
        
        calculateBillSummary();

        // ইনভেন্টরি ও ড্রপডাউন রিফ্রেশ
        if (typeof window.fetchProducts === 'function') window.fetchProducts();
        populateBillingDropdown();

        // 🎯 মাউস লক খোলার চূড়ান্ত ট্রিক
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