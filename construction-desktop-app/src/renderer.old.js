const { createClient } = require('@supabase/supabase-js');

// 🛠️ আপনার Supabase এর Credentials
const SUPABASE_URL = 'https://zbqrrfkhgfqfidwqrfxz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_datT1OkeZeRtYqgyVoU4bw_H7mk8w9q';

// সুপাবেস ক্লায়েন্ট ইনিশিয়েট করা
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements নিশ্চিত করা
const dbStatus = document.getElementById('db-status');
const productForm = document.getElementById('product-form');
const productListTbody = document.getElementById('product-list-tbody');

// ১. ডাটাবেজ কানেকশন চেক করার ফাংশন
async function checkConnection() {
    try {
        if (!dbStatus) return;
        
        // প্রোডাক্ট টেবিল থেকে রিড কল দিয়ে কানেকশন টেস্ট
        let { data, error } = await supabase.from('products').select('id').limit(1);
        
        if (error) throw error;

        // কানেকশন সাকসেস হলে ইন্ডিকেটর গ্রিন হবে
        dbStatus.innerText = "● Cloud DB Connected";
        dbStatus.className = "text-sm bg-green-500 text-white px-3 py-1 rounded-full font-semibold animate-none";
        
        // কানেক্ট হওয়ার সাথে সাথে লাইভ স্টক লিস্ট লোড হবে
        fetchProducts();
    } catch (err) {
        console.error("DB Connection Error:", err.message);
        if (dbStatus) {
            dbStatus.innerText = "● Connection Failed!";
            dbStatus.className = "text-sm bg-red-500 text-white px-3 py-1 rounded-full font-semibold animate-none";
        }
    }
}

// ২. ডাটাবেজ থেকে ইনভেন্টরি ডাটা নিয়ে এসে টেবিলে দেখানোর ফাংশন
async function fetchProducts() {
    try {
        if (!productListTbody) return;

        let { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        // টেবিল ক্লিয়ার করা
        productListTbody.innerHTML = '';

        if (!products || products.length === 0) {
            productListTbody.innerHTML = `<tr><td colspan="4" class="px-4 py-4 text-center text-gray-500">কোনো প্রোডাক্ট পাওয়া যায়নি।</td></tr>`;
            return;
        }

        // টেবিলে ডাটা পুশ করা
        products.forEach(prod => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-4 py-2 font-semibold text-gray-800 border-b">${prod.name}</td>
                <td class="px-4 py-2 text-blue-600 border-b">${prod.current_stock} ${prod.unit}</td>
                <td class="px-4 py-2 border-b">৳${prod.buying_price}</td>
                <td class="px-4 py-2 font-medium text-green-600 border-b">৳${prod.default_selling_price}</td>
            `;
            productListTbody.appendChild(row);
        });
    } catch (err) {
        console.error("Fetch Error:", err.message);
    }
}

// ৩. নতুন প্রোডাক্ট ডাটাবেজে সাবমিট বা সেভ করার লজিক
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // ইনপুট ভ্যালু নেওয়া
        const name = document.getElementById('prod-name').value;
        const unit = document.getElementById('prod-unit').value;
        const stock = parseFloat(document.getElementById('prod-stock').value) || 0;
        const buying = parseFloat(document.getElementById('prod-buying').value) || 0;
        const selling = parseFloat(document.getElementById('prod-selling').value) || 0;

        try {
            // সুপাবেস ক্লাউড ডাটাবেজে ডাটা ইনসার্ট করা
            const { data, error } = await supabase
                .from('products')
                .insert([
                    { 
                        name: name, 
                        unit: unit, 
                        current_stock: stock, 
                        buying_price: buying, 
                        default_selling_price: selling 
                    }
                ]);

            if (error) throw error;

            alert("প্রোডাক্ট সফলভাবে ক্লাউড ডাটাবেজে সেভ হয়েছে! 🎉");
            productForm.reset();
            fetchProducts(); // নতুন ডাটা সহ টেবিল আপডেট হবে

        } catch (err) {
            alert("ডাটা সেভ করতে ব্যর্থ: " + err.message);
        }
    });
}

// অ্যাপ চালু হওয়ার সাথে সাথে কানেকশন চেক রান হবে
checkConnection();

// ==========================================
// পর্ব ৪: ট্যাব স্যুইচিং এবং বিলিং লজিক কোড
// ==========================================

// DOM Elements
const tabInventoryBtn = document.getElementById('tab-inventory-btn');
const tabBillingBtn = document.getElementById('tab-billing-btn');
const tabReportBtn = document.getElementById('tab-report-btn');
const tabCustomerBtn = document.getElementById('tab-customer-btn');

const inventoryScreen = document.getElementById('inventory-screen');
const billingScreen = document.getElementById('billing-screen');
const reportScreen = document.getElementById('report-screen');
const customerScreen = document.getElementById('customer-screen');

const billProdSelect = document.getElementById('bill-prod-select');
const billProdQty = document.getElementById('bill-prod-qty');
const billProdRate = document.getElementById('bill-prod-rate');
const addToCartBtn = document.getElementById('add-to-cart-btn');
const cartTbody = document.getElementById('cart-tbody');

// সামারি এলিমেন্টস
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryExtraCost = document.getElementById('summary-extra-cost');
const summaryCostBearer = document.getElementById('summary-cost-bearer');
const summaryTotalPayable = document.getElementById('summary-total-payable');
const summaryCashPaid = document.getElementById('summary-cash-paid');
const summaryCalculatedDue = document.getElementById('summary-calculated-due');
const checkoutBillBtn = document.getElementById('checkout-bill-btn');

let globalProducts = []; // ডাটাবেজের প্রোডাক্ট সাময়িকভাবে রাখার জন্য
let cart = []; // কার্ট আইটেম লিস্ট

// 🛠️ ট্যাব নেভিগেশন মাস্টার লজিক (সব স্ক্রিন ফিক্সড)
function resetTabStyles() {
    tabInventoryBtn.className = "hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200";
    tabBillingBtn.className = "hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200";
    if (tabReportBtn) tabReportBtn.className = "hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200";
    if (tabCustomerBtn) tabCustomerBtn.className = "hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200";

    inventoryScreen.classList.add('hidden');
    billingScreen.classList.add('hidden');
    if (reportScreen) reportScreen.classList.add('hidden');
    if (customerScreen) customerScreen.classList.add('hidden');
}

tabInventoryBtn.addEventListener('click', () => {
    resetTabStyles();
    inventoryScreen.classList.remove('hidden');
    tabInventoryBtn.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white";
    fetchProducts();
});

tabBillingBtn.addEventListener('click', () => {
    resetTabStyles();
    billingScreen.classList.remove('hidden');
    tabBillingBtn.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white";
    populateProductDropdown(); 
});

if (tabReportBtn) {
    tabReportBtn.addEventListener('click', () => {
        resetTabStyles();
        reportScreen.classList.remove('hidden');
        tabReportBtn.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white";
        fetchDailyReports(); 
    });
}

if (tabCustomerBtn) {
    tabCustomerBtn.addEventListener('click', () => {
        resetTabStyles();
        customerScreen.classList.remove('hidden');
        tabCustomerBtn.className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white";
        fetchCustomers(); 
    });
}

// ২. বিলিং পেজের প্রোডাক্ট ড্রপডাউন লোড করা এবং লাইভ রেট শো করা
async function populateProductDropdown() {
    try {
        let { data: products, error } = await supabase.from('products').select('*');
        if (error) throw error;
        
        globalProducts = products; 
        billProdSelect.innerHTML = '';
        
        products.forEach(prod => {
            const opt = document.createElement('option');
            opt.value = prod.id;
            opt.innerText = `${prod.name} (স্টক: ${prod.current_stock})`;
            billProdSelect.appendChild(opt);
        });

        if(products.length > 0) updateRateField(products[0].id);

    } catch (err) {
        console.error("Dropdown loading failed:", err.message);
    }
}

billProdSelect.addEventListener('change', (e) => {
    updateRateField(e.target.value);
});

function updateRateField(productId) {
    const selectedProd = globalProducts.find(p => p.id == productId);
    if(selectedProd) {
        billProdRate.value = selectedProd.default_selling_price; 
    }
}

// ৩. কার্টে আইটেম যোগ করা (Add to Cart)
addToCartBtn.addEventListener('click', () => {
    const prodId = billProdSelect.value;
    const qty = parseFloat(billProdQty.value) || 0;
    const rate = parseFloat(billProdRate.value) || 0;

    if(!prodId || qty <= 0 || rate <= 0) {
        alert("দয়া করে সঠিক প্রোডাক্ট, পরিমাণ এবং রেট দিন।");
        return;
    }

    const item = globalProducts.find(p => p.id == prodId);
    
    const cartItem = {
        product_id: item.id,
        name: item.name,
        unit: item.unit,
        quantity: qty,
        price_per_unit: rate,
        total_price: qty * rate
    };

    cart.push(cartItem);
    renderCart();
    calculateBillSummary();
});

// ৪. কার্ট টেবিল রেন্ডার করা
function renderCart() {
    cartTbody.innerHTML = '';
    cart.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2 border-b">${item.name}</td>
            <td class="px-4 py-2 border-b">${item.quantity} ${item.unit}</td>
            <td class="px-4 py-2 border-b">৳${item.price_per_unit}</td>
            <td class="px-4 py-2 border-b font-semibold">৳${item.total_price.toFixed(2)}</td>
            <td class="px-4 py-2 border-b text-center">
                <button onclick="removeFromCart(${index})" class="text-red-500 hover:text-red-700 font-bold">❌ বাদ দিন</button>
            </td>
        `;
        cartTbody.appendChild(row);
    });
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    renderCart();
    calculateBillSummary();
}

// ৫. রিয়েল-টাইম বিল হিসাব ক্যালকুলেশন লজিক
function calculateBillSummary() {
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    summarySubtotal.innerText = subtotal.toFixed(2);

    const extraCost = parseFloat(summaryExtraCost.value) || 0;
    const bearer = summaryCostBearer.value;

    let totalPayable = subtotal;
    if (bearer === 'customer') {
        totalPayable += extraCost;
    }

    summaryTotalPayable.innerText = totalPayable.toFixed(2);

    const cashPaid = parseFloat(summaryCashPaid.value) || 0;
    const due = totalPayable - cashPaid;
    summaryCalculatedDue.innerText = due.toFixed(2);
}

summaryExtraCost.addEventListener('input', calculateBillSummary);
summaryCostBearer.addEventListener('change', calculateBillSummary);
summaryCashPaid.addEventListener('input', calculateBillSummary);

// ==========================================
// পর্ব ৫: ইনভয়েস কনফার্ম ও কাস্টমার লেজার লজিক
// ==========================================
checkoutBillBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
        alert("কার্ট খালি! দয়া করে অন্তত একটি প্রোডাক্ট যোগ করুন।");
        return;
    }

    const customerName = document.getElementById('bill-cust-name').value.trim() || "Unknown Customer";
    const customerPhone = document.getElementById('bill-cust-phone').value.trim() || "";
    const extraCost = parseFloat(summaryExtraCost.value) || 0;
    const bearer = summaryCostBearer.value;
    const subtotal = parseFloat(summarySubtotal.innerText) || 0;
    const totalPayable = parseFloat(summaryTotalPayable.innerText) || 0;
    const cashPaid = parseFloat(summaryCashPaid.value) || 0;
    const due = parseFloat(summaryCalculatedDue.innerText) || 0;

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
                alert(`দুঃখিত! ${item.name}-এর পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${currentProd.current_stock}`);
                return;
            }

            const updatedStock = currentProd.current_stock - item.quantity;
            let { error: updateErr } = await supabase
                .from('products')
                .update({ current_stock: updatedStock })
                .eq('id', item.product_id);

            if (updateErr) throw updateErr;
        }

        // ২. কাস্টমার লেজার সিঙ্ক লজিক 🎯
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
        const { data: saleData, error: saleErr } = await supabase
            .from('sales')
            .insert([
                {
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    subtotal: subtotal,
                    extra_cost: extraCost,
                    cost_bearer: bearer,
                    total_payable: totalPayable,
                    cash_paid: cashPaid,
                    due_amount: due
                }
            ]);

        if (saleErr) throw saleErr;

        alert(`🎉 বিল সফলভাবে সংরক্ষিত হয়েছে এবং কাস্টমার লেজার আপডেট হয়েছে!`);

        // ৪. ফর্ম ও কার্ট রিসেট
        cart = [];
        renderCart();
        document.getElementById('bill-cust-name').value = '';
        document.getElementById('bill-cust-phone').value = '';
        summaryExtraCost.value = 0;
        summaryCostBearer.value = 'none';
        summaryCashPaid.value = 0;
        calculateBillSummary();

        fetchProducts();
        populateProductDropdown();

    } catch (err) {
        alert("সমস্যা হয়েছে: " + err.message);
    }
});

// ==========================================
// মডিউল ৬: দৈনিক লাভ-ক্ষতি ও রিপোর্ট লজিক (ADDED 🎯)
// ==========================================
const reportSalesTbody = document.getElementById('report-sales-tbody');

async function fetchDailyReports() {
    try {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);

        let { data: sales, error } = await supabase
            .from('sales')
            .select('*')
            .gte('created_at', todayStart.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        let totalSales = 0;
        let cashReceived = 0;
        let totalDue = 0;
        let netProfit = 0; 

        if (reportSalesTbody) reportSalesTbody.innerHTML = '';

        sales.forEach(sale => {
            totalSales += sale.total_payable;
            cashReceived += sale.cash_paid;
            totalDue += sale.due_amount;
            netProfit += (sale.subtotal * 0.15); // আনুমানিক ১৫% লাভ মার্জিন

            if (reportSalesTbody) {
                const row = document.createElement('tr');
                const saleDate = new Date(sale.created_at).toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'});
                
                row.innerHTML = `
                    <td class="px-4 py-2 border-b">${saleDate}</td>
                    <td class="px-4 py-2 border-b font-semibold">৳${sale.total_payable.toFixed(2)}</td>
                    <td class="px-4 py-2 border-b text-green-600">৳${sale.cash_paid.toFixed(2)}</td>
                    <td class="px-4 py-2 border-b text-red-600 font-bold">৳${sale.due_amount.toFixed(2)}</td>
                `;
                reportSalesTbody.appendChild(row);
            }
        });

        if(document.getElementById('rep-total-sales')) document.getElementById('rep-total-sales').innerText = totalSales.toFixed(2);
        if(document.getElementById('rep-cash-received')) document.getElementById('rep-cash-received').innerText = cashReceived.toFixed(2);
        if(document.getElementById('rep-total-due')) document.getElementById('rep-total-due').innerText = totalDue.toFixed(2);
        if(document.getElementById('rep-net-profit')) document.getElementById('rep-net-profit').innerText = netProfit.toFixed(2);

    } catch (err) {
        console.error("Report loading failed:", err.message);
    }
}

// ==========================================
// মডিউল ৭: কাস্টমার খতিয়ান ডাটা লোড লজিক
// ==========================================
const customerTbody = document.getElementById('customer-tbody');

async function fetchCustomers() {
    try {
        if (!customerTbody) return;
        
        let { data: customers, error } = await supabase
            .from('customers')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        customerTbody.innerHTML = '';
        let totalMarketDue = 0;

        if (!customers || customers.length === 0) {
            customerTbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">কোনো কাস্টমার ডাটা পাওয়া যায়নি।</td></tr>`;
            if(document.getElementById('total-market-due')) document.getElementById('total-market-due').innerText = "0.00";
            return;
        }

        // গ্লোবাল অবজেক্টে কাস্টমার ডাটা ক্যাশ করে রাখা, যাতে স্পেস বা স্পেশাল ক্যারেক্টারে এরর না আসে
        window.cachedCustomers = customers;

        customers.forEach(cust => {
            totalMarketDue += cust.total_due;
            const row = document.createElement('tr');
            const dueColor = cust.total_due > 0 ? 'text-red-600 font-bold' : 'text-gray-500';

            // এখানে openPaymentModal-এ ডিরেক্ট স্ট্রিং না পাঠিয়ে শুধু আইডি পাঠানো হচ্ছে যা ১০০% সেফ
            row.innerHTML = `
                <td class="px-4 py-3 border-b font-medium text-gray-800">${cust.name}</td>
                <td class="px-4 py-3 border-b text-gray-600">${cust.phone || 'N/A'}</td>
                <td class="px-4 py-3 border-b ${dueColor}">৳${cust.total_due.toFixed(2)}</td>
                <td class="px-4 py-3 border-b text-center">
                    <button onclick="triggerPaymentModal(${cust.id})" class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded shadow-sm font-medium">💵 টাকা জমা নিন</button>
                </td>
            `;
            customerTbody.appendChild(row);
        });

        const marketDueElem = document.getElementById('total-market-due');
        if (marketDueElem) marketDueElem.innerText = totalMarketDue.toFixed(2);

    } catch (err) {
        console.error("Customer ledger loading failed:", err.message);
    }
}

// সেফ বাটন ট্রিগার ফাংশন যা ক্যাশ থেকে কাস্টমার অবজেক্ট খুঁজে বের করবে
window.triggerPaymentModal = function(id) {
    if(!window.cachedCustomers) return;
    const cust = window.cachedCustomers.find(c => c.id === id);
    if(cust) {
        openPaymentModal(cust.id, cust.name, cust.total_due);
    }
}

// ========================================================
// 💵 কাস্টমার পেমেন্ট মডিউল লজিক (গ্লোবাল স্কোপ ফিক্স)
// ========================================================

// বাটনের ক্লিকে ক্যাশ থেকে ডাটা খোঁজার সেফ ট্রিগার ফাংশন
window.triggerPaymentModal = function(id) {
    if(!window.cachedCustomers) {
        console.error("No cached customers found!");
        return;
    }
    const cust = window.cachedCustomers.find(c => c.id === id);
    if(cust) {
        window.openPaymentModal(cust.id, cust.name, cust.total_due);
    } else {
        console.error("Customer not found in cache for ID:", id);
    }
}

// মডাল ওপেন করার মেইন ফাংশন
window.openPaymentModal = function(id, name, totalDue) {
    const paymentModal = document.getElementById('payment-modal');
    const modalCustId = document.getElementById('modal-cust-id');
    const modalCustName = document.getElementById('modal-cust-name');
    const modalCustDue = document.getElementById('modal-cust-due');
    const modalPayAmount = document.getElementById('modal-pay-amount');

    if (!paymentModal) {
        alert("Error: 'payment-modal' HTML element-টি খুঁজে পাওয়া যায়নি! আপনার HTML ফাইল চেক করুন।");
        return;
    }
    
    // ডাটা সেট করা
    modalCustId.value = id;
    modalCustName.innerText = name;
    modalCustDue.innerText = `৳${parseFloat(totalDue).toFixed(2)}`;
    modalPayAmount.value = ''; 
    
    // মডাল স্ক্রিনে দেখানো (hidden ক্লাস রিমুভ করা)
    paymentModal.classList.remove('hidden');
}

// মডাল ক্লোজ করার লজিক
document.addEventListener('click', function(e) {
    if(e.target && e.target.id === 'close-modal-btn') {
        const paymentModal = document.getElementById('payment-modal');
        if(paymentModal) paymentModal.classList.add('hidden');
    }
});
// ========================================================
// 💵 জমা নিশ্চিত করুন বাটনের ব্যাকএন্ড ও ডাটাবেজ লজিক 🎯
// ========================================================

document.addEventListener('click', async function(e) {
    // চেক করা হচ্ছে ক্লিকটি "জমা নিশ্চিত করুন" বাটনে পড়েছে কি না
    if(e.target && e.target.id === 'submit-payment-btn') {
        
        const modalCustId = document.getElementById('modal-cust-id');
        const modalCustDue = document.getElementById('modal-cust-due');
        const modalPayAmount = document.getElementById('modal-pay-amount');
        const paymentModal = document.getElementById('payment-modal');

        const custId = modalCustId.value;
        const payAmount = parseFloat(modalPayAmount.value) || 0;
        
        // '৳' চিহ্ন বাদ দিয়ে শুধু সংখ্যার বকেয়া বের করা
        const currentDue = parseFloat(modalCustDue.innerText.replace('৳', '')) || 0;

        // 🔍 QA ভ্যালিডেশন চেক
        if (payAmount <= 0) {
            alert("দয়া করে সঠিক জমার পরিমাণ লিখুন।");
            return;
        }
        if (payAmount > currentDue) {
            alert(`সতর্কতা: কাস্টমারের বকেয়া ৳${currentDue.toFixed(2)}, আপনি বকেয়ার চেয়ে বেশি টাকা জমা নিতে পারবেন না!`);
            return;
        }

        try {
            // ১. 'customer_payments' টেবিলে ট্রানজেকশন হিস্ট্রি সেভ করা
            const { error: paymentErr } = await supabase
                .from('customer_payments')
                .insert([
                    { customer_id: custId, amount_paid: payAmount }
                ]);

            if (paymentErr) throw paymentErr;

            // ২. 'customers' টেবিলে নতুন বকেয়া (total_due) মাইনাস করে আপডেট করা
            const updatedDue = currentDue - payAmount;
            const { error: custUpdateErr } = await supabase
                .from('customers')
                .update({ total_due: updatedDue })
                .eq('id', custId);

            if (custUpdateErr) throw custUpdateErr;

            // 🎉 সফলতার মেসেজ
            alert(`🎉 ৳${payAmount} সফলভাবে জমা নেওয়া হয়েছে!\nবর্তমান বকেয়া: ৳${updatedDue.toFixed(2)}`);
            
            // মডাল বন্ধ করা এবং কাস্টমার লিস্ট রিল্যাপ্স/রিফ্রেশ করা
            if(paymentModal) paymentModal.classList.add('hidden');
            
            if (typeof fetchCustomers === 'function') {
                fetchCustomers(); // টেবিল লাইভ আপডেট হবে
            }

        } catch (err) {
            alert("টাকা জমা নিতে সমস্যা হয়েছে: " + err.message);
            console.error("Payment submission failed:", err.message);
        }
    }
});