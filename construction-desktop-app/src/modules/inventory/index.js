// ========================================================
// 🚀 3. INVENTORY MAIN ENTRY POINT & EVENT INITIALIZER
// ========================================================

const { fetchProducts } = require('./fetch');
const { handleProductSubmit } = require('./operations');

// 🎯 নন-ব্লকিং অ্যাপ টোস্ট নোটিফিকেশন ফাংশন
function showToast(message, isError = false) {
    const oldToast = document.getElementById('app-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.innerText = message;
    
    toast.className = `fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transition-all duration-300 ${
        isError ? 'bg-red-600' : 'bg-green-600'
    }`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function initProductForm() {
    const productForm = document.getElementById('product-form') || document.querySelector('form');
    const productSelect = document.getElementById('product-select');
    
    const prodNameInput = document.getElementById('prod-name') || document.querySelector('input[placeholder*="BSRM"]') || document.querySelectorAll('form input')[0];
    const prodUnitInput = document.getElementById('prod-unit') || document.querySelector('form select:not(#product-select)') || document.querySelectorAll('form select')[0];
    const prodStockInput = document.getElementById('prod-stock') || document.querySelector('form input[type="number"]') || document.querySelectorAll('form input')[1];
    
    const allInputs = document.querySelectorAll('form input');
    let prodBuyingInput = document.getElementById('prod-buying');
    let prodSellingInput = document.getElementById('prod-selling');
    
    if (!prodBuyingInput && allInputs.length >= 4) {
        prodBuyingInput = allInputs[allInputs.length - 2]; 
        prodSellingInput = allInputs[allInputs.length - 1]; 
    }

    if (!productForm) {
        console.error("Form element could not be resolved!");
        return;
    }

    // ইনপুট ভ্যারিয়েবল অবজেক্ট পাস করার জন্য
    const inputFields = { productSelect, prodNameInput, prodUnitInput, prodStockInput, prodBuyingInput, prodSellingInput };

    // ড্রপডাউন সিলেক্ট চেঞ্জ ইভেন্ট
    if (productSelect) {
        productSelect.onchange = function() {
            const selectedId = parseInt(this.value);
            if (selectedId && (window.cachedProducts || []).length > 0) {
                const prod = window.cachedProducts.find(p => p.id === selectedId);
                if (prod) {
                    if (prodNameInput) { prodNameInput.value = prod.name; prodNameInput.disabled = true; }
                    if (prodUnitInput) prodUnitInput.value = prod.unit;
                    if (prodBuyingInput) prodBuyingInput.value = prod.buying_price;
                    if (prodSellingInput) prodSellingInput.value = prod.default_selling_price;
                    if (prodStockInput) { prodStockInput.value = ''; prodStockInput.placeholder = "নতুন চালানের স্টক লিখুন"; }
                }
            } else {
                if (prodNameInput) { prodNameInput.value = ''; prodNameInput.disabled = false; }
                if (prodUnitInput) prodUnitInput.selectedIndex = 0;
                if (prodBuyingInput) prodBuyingInput.value = '';
                if (prodSellingInput) prodSellingInput.value = '';
                if (prodStockInput) { prodStockInput.value = ''; prodStockInput.placeholder = "0"; }
            }
        };
    }

    // ফর্ম সাবমিট ইভেন্ট বাইন্ডিং
    productForm.onsubmit = function(e) {
        handleProductSubmit(e, productForm, inputFields);
    };
}

module.exports = { fetchProducts, initProductForm, showToast };