// ==========================================
// 🛒 1. CART & PRODUCTS STATE MANAGEMENT
// ==========================================
const { supabase } = require('../../config/supabaseClient'); // সেটিংস থেকে ডাটা রিড করার জন্য

let cart = [];
let globalProducts = [];

function getCart() { return cart; }
function setCart(newCart) { cart = newCart; }
function getGlobalProducts() { return globalProducts; }
function setGlobalProducts(products) { globalProducts = products; }

// 🛒 কার্ট টেবিল রেন্ডার করা
function renderCart() {
    const cartTbody = document.getElementById('cart-tbody');
    if (!cartTbody) return;

    cartTbody.innerHTML = '';
    cart.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2 border-b font-semibold text-gray-800">${item.name}</td>
            <td class="px-4 py-2 border-b text-blue-600">${item.quantity} ${item.unit}</td>
            <td class="px-4 py-2 border-b">৳${item.price_per_unit}</td>
            <td class="px-4 py-2 border-b font-semibold text-gray-700">৳${item.total_price.toFixed(2)}</td>
            <td class="px-4 py-2 border-b text-center">
                <button onclick="window.removeFromCart(${index})" class="text-red-500 hover:text-red-700 font-bold">❌ বাদ দিন</button>
            </td>
        `;
        cartTbody.appendChild(row);
    });

    // 🎯 আপনার আগের গ্লোবাল ক্যালকুলেশন কল (ঠিক রাখা হলো)
    const { calculateBillSummary } = require('./calculations');
    calculateBillSummary();

    // ⚙️ লেবার রেট সেটিংস টেবিল থেকে ডাটা এনে অতিরিক্ত খরচের ইনপুট ফিল্ড অটো-আপডেট করা (নন-ব্লকিং)
    calculateAutoLaborCost();
}

// 🧠 ডেটাবেজের নতুন স্ট্রাকচার (bag, kg, bundle) অনুযায়ী লেবার খরচ হিসাব করার ফিক্সড ফাংশন
function calculateAutoLaborCost() {
    // 🎯 পুরাতন summary-extra-cost বদলে আমাদের নতুন তৈরি করা summary-labor-cost আইডি টার্গেট করা হয়েছে
    const summaryLaborCost = document.getElementById('summary-labor-cost');
    if (!summaryLaborCost) return;

    // কার্ট খালি থাকলে লেবার বিল ০ করে দেওয়া
    if (cart.length === 0) {
        summaryLaborCost.value = 0;
        summaryLaborCost.dispatchEvent(new Event('input', { bubbles: true }));
        
        // বিল রি-ক্যালকুলেট করা
        const { calculateBillSummary } = require('./calculations');
        calculateBillSummary();
        return;
    }

    // ১. সুপাবেজ থেকে লেবার সেটিংসের লেটেস্ট রেট নিয়ে আসা
    supabase.from('labor_settings').select('*')
        .then(({ data: settings, error }) => {
            if (error) throw error;
            if (!settings) return;

            // ডেটাবেজের রেটগুলোকে একটি ম্যাপে নেওয়া (যেমন: {'bag': 2, 'kg': 0.2, 'bundle': 0, 'others': 0})
            const rateMap = {};
            settings.forEach(s => {
                rateMap[s.category_key.trim().toLowerCase()] = parseFloat(s.rate_per_unit) || 0;
            });

            let totalLaborCost = 0;

            // ২. কার্টের প্রতিটা প্রোডাক্ট লুপ চালিয়ে হিসাব করা
            cart.forEach(item => {
                const qty = parseFloat(item.quantity) || 0;
                
                // কার্টের প্রোডাক্টের ইউনিট রিড করা (যেমন: "ব্যাগ", "কেজি" বা "১ ব্যাগ")
                const rawUnit = (item.unit || '').trim().toLowerCase();
                let targetKey = 'others'; // ডিফল্ট কি

                // ৩. 🎯 কার্টের বাংলা/মিশ্র ইউনিটকে ডেটাবেজের ইংলিশ Key-এর সাথে নিখুঁতভাবে ম্যাচিং
                if (rawUnit.includes('ব্যাগ') || rawUnit.includes('bag') || rawUnit.includes('bosta')) {
                    targetKey = 'bag';
                } else if (rawUnit.includes('কেজি') || rawUnit.includes('kg')) {
                    targetKey = 'kg';
                } else if (rawUnit.includes('বান্ডিল') || rawUnit.includes('bundle')) {
                    targetKey = 'bundle';
                }

                // ৪. রেট ম্যাপ থেকে ভ্যালু নিয়ে গুণ করা
                if (rateMap[targetKey] !== undefined) {
                    totalLaborCost += qty * rateMap[targetKey];
                } else {
                    totalLaborCost += qty * (rateMap['others'] || 0);
                }
            });

            // 🎯 ৫. নতুন লেবার খরচ ফিল্ডে টোটাল অ্যামাউন্ট বসানো
            summaryLaborCost.value = totalLaborCost.toFixed(2);
            
            // ইনপুট ইভেন্ট ফায়ার করা
            summaryLaborCost.dispatchEvent(new Event('input', { bubbles: true }));

            // 🔄 নতুন দুটি ড্রপডাউনের ওপর ভিত্তি করে যেন মেইন বিল তাৎক্ষণিক আপডেট হয়, তাই calculations কল করা হলো
            const { calculateBillSummary } = require('./calculations');
            calculateBillSummary();
        })
        .catch(err => {
            console.error("লেবার খরচ অটো-ক্যালকুলেট করতে সমস্যা হয়েছে:", err.message);
        });
}

// কার্ট থেকে আইটেম রিমুভ করার গ্লোবাল উইন্ডো ফাংশন
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    renderCart();
};

// 🛒 কার্টে আইটেম যোগ করা (Add to Cart)
function handleAddToCart() {
    const billProdSelect = document.getElementById('bill-prod-select');
    const billProdQty = document.getElementById('bill-prod-qty');
    const billProdRate = document.getElementById('bill-prod-rate');

    const prodId = billProdSelect ? billProdSelect.value : null;
    const qty = parseFloat(billProdQty ? billProdQty.value : 0) || 0;
    const rate = parseFloat(billProdRate ? billProdRate.value : 0) || 0;

    if (!prodId || qty <= 0 || rate <= 0) {
        const { showToast } = require('./index');
        showToast("দয়া করে সঠিক প্রোডাক্ট, পরিমাণ এবং রেট দিন।", true);
        return;
    }

    if (!globalProducts || globalProducts.length === 0) {
        if (window.cachedProducts) globalProducts = window.cachedProducts;
    }

    const item = globalProducts.find(p => p.id == prodId);
    if (!item) return;
    
    const existingIndex = cart.findIndex(c => c.product_id == prodId);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += qty;
        cart[existingIndex].total_price = cart[existingIndex].quantity * cart[existingIndex].price_per_unit;
    } else {
        cart.push({
            product_id: item.id,
            name: item.name,
            unit: item.unit,
            quantity: qty,
            price_per_unit: rate,
            total_price: qty * rate
        });
    }

    renderCart();
    if (billProdQty) billProdQty.value = '1';
}

module.exports = {
    getCart,
    setCart,
    getGlobalProducts,
    setGlobalProducts,
    renderCart,
    handleAddToCart
};