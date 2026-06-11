// ==========================================
// 🛒 1. CART & PRODUCTS STATE MANAGEMENT
// ==========================================

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

    // কার্ট আপডেট হলেই গ্লোবাল ক্যালকুলেশন কল হবে
    const { calculateBillSummary } = require('./calculations');
    calculateBillSummary();
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