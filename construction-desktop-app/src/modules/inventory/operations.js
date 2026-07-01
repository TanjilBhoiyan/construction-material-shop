// ========================================================
// 🛠️ 2. INVENTORY CONTROLLER (Handles UI events & calls Service)
// ========================================================

const { InventoryService } = require('./inventory.service');
const { fetchProducts } = require('./fetch');

/**
 * 🚛 UI থেকে আনলোডিং খরচ ক্যালকুলেট করার জন্য
 */
async function calculateLiveUnloadingCost(prodStockInput, prodUnitInput, unloadingCostInput) {
    if (!prodStockInput || !prodUnitInput || !unloadingCostInput) return;

    const stock = parseFloat(prodStockInput.value) || 0;
    const unit = prodUnitInput.value || '';

    // সার্ভিস লেয়ার থেকে ক্যালকুলেশন লজিক কল করা হচ্ছে
    const cost = await InventoryService.calculateUnloadingCost(stock, unit);
    unloadingCostInput.value = cost;
}

function initInventoryCalculations(inputs) {
    const { prodStockInput, prodUnitInput } = inputs;
    const unloadingCostInput = document.getElementById('prod-unloading-cost');

    if (!prodStockInput || !prodUnitInput || !unloadingCostInput) return;

    prodStockInput.addEventListener('input', () => calculateLiveUnloadingCost(prodStockInput, prodUnitInput, unloadingCostInput));
    prodUnitInput.addEventListener('change', () => calculateLiveUnloadingCost(prodStockInput, prodUnitInput, unloadingCostInput));
}

async function handleProductSubmit(e, productForm, inputs) {
    e.preventDefault();
    const { showToast } = require('./index');

    const { productSelect, prodNameInput, prodUnitInput, prodStockInput, prodBuyingInput, prodSellingInput } = inputs;
    const unloadingCostInput = document.getElementById('prod-unloading-cost');

    const submitBtn = productForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "⏳ ডাটা সেভ হচ্ছে...";
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    const productData = {
        selectedId: productSelect ? productSelect.value : "",
        name: prodNameInput ? prodNameInput.value.trim() : "",
        unit: prodUnitInput ? prodUnitInput.value.trim() : "",
        newStock: parseFloat(prodStockInput ? prodStockInput.value : 0) || 0,
        buyingPrice: parseFloat(prodBuyingInput ? prodBuyingInput.value : 0) || 0,
        sellingPrice: parseFloat(prodSellingInput ? prodSellingInput.value : 0) || 0,
        unloadingLaborCost: parseFloat(unloadingCostInput ? unloadingCostInput.value : 0) || 0,
        cachedProducts: window.cachedProducts
    };

    if (!productData.name || productData.newStock <= 0 || productData.buyingPrice <= 0 || productData.sellingPrice <= 0) {
        showToast("দয়া করে সব ঘর সঠিকভাবে পূরণ করুন!", true);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "💾 ডাটাবেজে সেভ করুন";
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        return;
    }

    try {
        // সার্ভিস লেয়ারের মাধ্যমে ডাটা প্রসেসিং
        await InventoryService.processProductSubmission(productData);
        
        showToast(productData.selectedId ? `🎉 স্টক সফলভাবে আপডেট হয়েছে!` : `🎉 নতুন প্রোডাক্ট "${productData.name}" সেভ হয়েছে!`);

        // ফর্ম রিসেট
        if (prodNameInput) { prodNameInput.disabled = false; prodNameInput.value = ''; }
        productForm.reset();
        if (prodStockInput) prodStockInput.placeholder = "0";
        if (unloadingCostInput) unloadingCostInput.value = "0";

        await fetchProducts();

        setTimeout(() => {
            window.focus();
            if (prodNameInput) prodNameInput.focus();
        }, 50);

    } catch (err) {
        showToast("ডাটা সেভ করতে সমস্যা হয়েছে: " + err.message, true);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "💾 ডাটাবেজে সেভ করুন";
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

module.exports = { handleProductSubmit, initInventoryCalculations };