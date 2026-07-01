// ========================================================
// 🛠️ 2. INVENTORY DATABASE OPERATIONS (INSERT/UPDATE)
// ========================================================

const { InventoryRepository } = require('./inventory.repository');
const { fetchProducts } = require('./fetch');

/**
 * 🚛 লাইভ আনলোডিং লেবার খরচ ক্যালকুলেট করার জন্য হেল্পার ফাংশন
 */
async function calculateLiveUnloadingCost(prodStockInput, prodUnitInput, unloadingCostInput) {
    if (!prodStockInput || !prodUnitInput || !unloadingCostInput) return;

    const stock = parseFloat(prodStockInput.value) || 0;
    const unit = prodUnitInput.value || '';

    if (stock <= 0 || !unit) {
        unloadingCostInput.value = 0;
        return;
    }

    let dbCategoryKey = 'others';
    const rawUnitLower = unit.toLowerCase();
    if (rawUnitLower.includes('ব্যাগ') || rawUnitLower.includes('bag')) dbCategoryKey = 'bag';
    else if (rawUnitLower.includes('কেজি') || rawUnitLower.includes('kg')) dbCategoryKey = 'kg';
    else if (rawUnitLower.includes('বান্ডিল') || rawUnitLower.includes('bundle')) dbCategoryKey = 'bundle';
    else if (rawUnitLower.includes('পিস') || rawUnitLower.includes('piece') || rawUnitLower.includes('pcs')) dbCategoryKey = 'pcs';

    try {
        const { data, error } = await InventoryRepository.getLaborRate(dbCategoryKey);
        if (error) throw error;

        if (data) {
            const rate = parseFloat(data.unloading_rate_per_unit) || 0;
            unloadingCostInput.value = (stock * rate).toFixed(2);
        }
    } catch (err) {
        console.error("লাইভ আনলোডিং খরচ ক্যালকুলেট করতে সমস্যা:", err.message);
    }
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

    const selectedId = productSelect ? productSelect.value : "";
    const name = prodNameInput ? prodNameInput.value.trim() : "";
    const unit = prodUnitInput ? prodUnitInput.value.trim() : "";
    const newStock = parseFloat(prodStockInput ? prodStockInput.value : 0) || 0;
    const buyingPrice = parseFloat(prodBuyingInput ? prodBuyingInput.value : 0) || 0;
    const sellingPrice = parseFloat(prodSellingInput ? prodSellingInput.value : 0) || 0;
    const unloadingLaborCost = parseFloat(unloadingCostInput ? unloadingCostInput.value : 0) || 0;

    if (!name || newStock <= 0 || buyingPrice <= 0 || sellingPrice <= 0) {
        showToast("দয়া করে সব ঘর সঠিকভাবে পূরণ করুন!", true);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "💾 ডাটাবেজে সেভ করুন";
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        return;
    }

    try {
        if (selectedId) {
            const existingProd = (window.cachedProducts || []).find(p => p.id === parseInt(selectedId));
            const finalStock = parseFloat(existingProd ? existingProd.current_stock : 0) + newStock;

            await InventoryRepository.updateProduct(selectedId, {
                current_stock: finalStock,
                buying_price: buyingPrice,
                default_selling_price: sellingPrice,
                unit: unit,
                unloading_labor_cost: unloadingLaborCost
            });

            if (unloadingLaborCost > 0) {
                await InventoryRepository.insertLog({
                    product_id: parseInt(selectedId),
                    product_name: name,
                    labor_cost: unloadingLaborCost
                });
            }
            showToast(`🎉 ${name}-এর স্টক সফলভাবে আপডেট হয়েছে!`);
        } else {
            const { data, error } = await InventoryRepository.insertProduct({
                name, unit,
                current_stock: newStock,
                buying_price: buyingPrice,
                default_selling_price: sellingPrice,
                unloading_labor_cost: unloadingLaborCost
            });
            if (error) throw error;

            const newProductId = data[0].id;
            if (unloadingLaborCost > 0) {
                await InventoryRepository.insertLog({
                    product_id: newProductId,
                    product_name: name,
                    labor_cost: unloadingLaborCost
                });
            }
            showToast(`🎉 নতুন প্রোডাক্ট "${name}" সেভ হয়েছে!`);
        }

        // ফর্ম রিসেট ও রিফ্রেশ
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