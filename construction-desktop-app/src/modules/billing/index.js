// ==========================================
// 🚀 4. MAIN ENTRY POINT - MODULE INITIALIZER
// ==========================================
const TomSelect = require('tom-select');
//const { supabase } = require('../../config/supabaseClient');
const { setGlobalProducts, handleAddToCart } = require('./cart');
const { calculateBillSummary } = require('./billing.controller');
const { handleCheckout } = require('./checkout');
const { BillingRepository } = require('./billing.repository');

// 🔄 ডাটাবেজ থেকে বিলিং পেজের প্রোডাক্ট ড্রপডাউন লোড করা
async function populateBillingDropdown() {
    try {
        const billProdSelect = document.getElementById('bill-prod-select');
        if (!billProdSelect) return;

        // ১. রিপোজিটরি কল
        const { data: products, error } = await BillingRepository.getProducts();
        if (error) throw error;
        
        setGlobalProducts(products);
        window.cachedProducts = products; 
        
        billProdSelect.innerHTML = '';
        products.forEach(prod => {
            const opt = document.createElement('option');
            opt.value = prod.id;
            opt.innerText = `${prod.name} (স্টক: ${prod.current_stock} ${prod.unit || ''})`;
            billProdSelect.appendChild(opt);
        });

        if (products.length > 0) {
            updateRateField(products[0].id);
        }
    } catch (err) {
        console.error("Dropdown loading failed:", err.message);
    }
}
async function populateAddressDropdown() {
    const addressSelect = document.getElementById('customer-address');

    if (!addressSelect) return;

    const addresses = [
        'উত্তর মোহাম্মদপুর','দক্ষিণ মোহাম্মদপুর','আটিপাড়া','বায়নাগড়','পিপিয়া','মালিগাঁও','কালাসোনা','উত্তর নগর','দক্ষিণ নগর',
        'তালেরছেও','জোয়ারীখলা','বারৈয়ারা','সাচার','বুধুন্ডা','পালাখাল','টাগুড়িয়া','মাঝিগাছা','শিলাস্থান','মধুপুর','পিতাম্বর্দ্দি',
        'পেয়ারী খোলা'

    ];

    addressSelect.innerHTML =
        '<option value="">ঠিকানা নির্বাচন করুন</option>';

    addresses.forEach(address => {
        const option = document.createElement('option');
        option.value = address;
        option.textContent = address;
        addressSelect.appendChild(option);
    });
}

// সিলেক্টেড প্রোডাক্ট অনুযায়ী রেট ফিল্ড আপডেট
function updateRateField(productId) {
    const billProdRate = document.getElementById('bill-prod-rate');
    let globalProducts = window.cachedProducts || [];
    const selectedProd = globalProducts.find(p => p.id == productId);
    if (selectedProd && billProdRate) {
        billProdRate.value = selectedProd.default_selling_price; 
    }
}

// 🎯 NON-BLOCKING অ্যাপ টোস্ট নোটিফিকেশন ফাংশন
function showToast(message, isError = false) {
    const oldToast = document.getElementById('app-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.innerText = message;

    if (isError) {
        toast.className = 'fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg text-white bg-red-600 z-50 font-semibold animate-shake';
    } else {
        toast.className = 'fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg text-white bg-green-600 z-50 font-semibold';
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// বিলিং স্ক্রিন ইনিশিয়েট করার মেইন ফাংশন
function initBillingModule() {
    const billProdSelect = document.getElementById('bill-prod-select');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const checkoutBillBtn = document.getElementById('checkout-bill-btn');
    
    // 🎯 পুরোনো ২টি আইডির বদলে আমাদের নতুন ৪টি আইডি রিড করা হয়েছে
    const summaryLaborCost = document.getElementById('summary-labor-cost');
    const summaryLaborBearer = document.getElementById('summary-labor-bearer');
    const summaryTransportCost = document.getElementById('summary-transport-cost');
    const summaryTransportBearer = document.getElementById('summary-transport-bearer');
    
    const summaryCashPaid = document.getElementById('summary-cash-paid');

    populateBillingDropdown();
    populateAddressDropdown();

    if (billProdSelect) {
        billProdSelect.onchange = (e) => updateRateField(e.target.value);
    }

    // ❌ কোনো cloneNode(true) নাই, সরাসরি ওল্ড-স্কুল অন-ক্লিক সেফ বাইন্ডিং
    if (addToCartBtn) {
        addToCartBtn.onclick = function(e) {
            e.preventDefault();
            handleAddToCart();
        };
    }

    // 🎯 নতুন লেবার এবং গাড়ি ভাড়ার ইনপুট ও ড্রপডাউনে লাইভ ইভেন্ট বাইন্ডিং
    if (summaryLaborCost) summaryLaborCost.oninput = calculateBillSummary;
    if (summaryLaborBearer) summaryLaborBearer.onchange = calculateBillSummary;
    if (summaryTransportCost) summaryTransportCost.oninput = calculateBillSummary;
    if (summaryTransportBearer) summaryTransportBearer.onchange = calculateBillSummary;
    
    if (summaryCashPaid) summaryCashPaid.oninput = calculateBillSummary;

    // 💾 ইনভয়েস কনফার্ম বাটন
    if (checkoutBillBtn) {
        checkoutBillBtn.onclick = function(e) {
            e.preventDefault();
            handleCheckout(checkoutBillBtn);
        };
    }
}

module.exports = { initBillingModule, populateBillingDropdown, showToast };