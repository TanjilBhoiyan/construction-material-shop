// ========================================================
// 🛠️ 2. INVENTORY DATABASE OPERATIONS (INSERT/UPDATE)
// ========================================================

const { supabase } = require('../../config/supabaseClient');
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

    // ইউনিটের নাম অনুযায়ী ডাটাবেজের category_key ম্যাপ করা
    let dbCategoryKey = 'others';
    const rawUnitLower = unit.toLowerCase();
    if (rawUnitLower.includes('ব্যাগ') || rawUnitLower.includes('bag')) dbCategoryKey = 'bag';
    else if (rawUnitLower.includes('কেজি') || rawUnitLower.includes('kg')) dbCategoryKey = 'kg';
    else if (rawUnitLower.includes('বান্ডিল') || rawUnitLower.includes('bundle')) dbCategoryKey = 'bundle';

    try {
        // সুপাবেজ থেকে সরাসরি লাইভ আনলোডিং রেট তুলে আনা
        const { data, error } = await supabase
            .from('labor_settings')
            .select('unloading_rate_per_unit')
            .eq('category_key', dbCategoryKey)
            .single();

        if (error) throw error;

        if (data) {
            const rate = parseFloat(data.unloading_rate_per_unit) || 0;
            // মোট খরচ = পরিমাণ × আনলোডিং রেট
            unloadingCostInput.value = (stock * rate).toFixed(2);
        }
    } catch (err) {
        console.error("লাইভ আনলোডিং খরচ ক্যালকুলেট করতে সমস্যা:", err.message);
    }
}

/**
 * 🎯 এই মডিউলের লিসেনারগুলো সেটআপ করার জন্য মেইন ইনিশিয়ালাইজার ফাংশন
 * (এটি আপনার index.js বা ফর্ম লোড হওয়ার সময় একবার কল করে দিবেন)
 */
function initInventoryCalculations(inputs) {
    const { prodStockInput, prodUnitInput } = inputs;
    const unloadingCostInput = document.getElementById('prod-unloading-cost');

    if (!prodStockInput || !prodUnitInput || !unloadingCostInput) return;

    // ১. যখন ইউজার পরিমাণ (Stock) বক্সে টাইপ করবেন
    prodStockInput.addEventListener('input', () => {
        calculateLiveUnloadingCost(prodStockInput, prodUnitInput, unloadingCostInput);
    });

    // ২. যখন ইউজার ইউনিটের ড্রপডাউন চেঞ্জ করবেন
    prodUnitInput.addEventListener('change', () => {
        calculateLiveUnloadingCost(prodStockInput, prodUnitInput, unloadingCostInput);
    });
}

async function handleProductSubmit(e, productForm, inputs) {
    e.preventDefault();
    const { showToast } = require('./index');

    const { productSelect, prodNameInput, prodUnitInput, prodStockInput, prodBuyingInput, prodSellingInput } = inputs;
    const unloadingCostInput = document.getElementById('prod-unloading-cost');

    // ১. সাবমিট বাটনটি ডিজেবল করে দেওয়া
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
    // এডিটেবল ইনপুট বক্স থেকে ফাইনাল আনলোডিং খরচ রিড করা (ইউজার চাইলে ওভাররাইড করতে পারেন)
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
            // এক্সিস্টিং প্রোডাক্টের স্টক আপডেট
            const existingProd = (window.cachedProducts || []).find(p => p.id === parseInt(selectedId));
            const finalStock = parseFloat(existingProd ? existingProd.current_stock : 0) + newStock;

            const { error } = await supabase
                .from('products')
                .update({
                    current_stock: finalStock,
                    buying_price: buyingPrice,
                    default_selling_price: sellingPrice,
                    unit: unit,
                    unloading_labor_cost: unloadingLaborCost // ডাটাবেজে নতুন আনলোডিং খরচ সেভ
                })
                .eq('id', selectedId);

            if (error) throw error;
            showToast(`🎉 ${name}-এর স্টক সফলভাবে আপডেট হয়েছে!`);
        } else {
            // ডুপ্লিকেট প্রোডাক্ট নেম চেক
            const isDuplicate = (window.cachedProducts || []).some(p => p.name.toLowerCase() === name.toLowerCase());
            if (isDuplicate) {
                showToast("এই নামের প্রোডাক্ট অলরেডি আছে!", true);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = "💾 ডাটাবেজে সেভ করুন";
                    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
                return;
            }

            // নতুন প্রোডাক্ট ইনসার্ট
            const { error } = await supabase
                .from('products')
                .insert([{
                    name,
                    unit,
                    current_stock: newStock,
                    buying_price: buyingPrice,
                    default_selling_price: sellingPrice,
                    unloading_labor_cost: unloadingLaborCost // ডাটাবেজে নতুন আনলোডিং খরচ সেভ
                }]);

            if (error) throw error;
            showToast(`🎉 নতুন প্রোডাক্ট "${name}" সেভ হয়েছে!`);
        }

        // 🎯 ২. লেবার সেটিংসে ইউনিটের অটো-রেজিস্ট্রেশন লজিক (১০০% পারফেক্ট ম্যাপিং)
        if (unit) {
            let dbCategoryKey = '';
            let dbCategoryNameBn = '';

            const rawUnitLower = unit.toLowerCase();

            if (rawUnitLower.includes('ব্যাগ') || rawUnitLower.includes('bag')) {
                dbCategoryKey = 'bag';
                dbCategoryNameBn = 'সিমেন্ট (বস্তা)';
            } else if (rawUnitLower.includes('কেজি') || rawUnitLower.includes('kg')) {
                dbCategoryKey = 'kg';
                dbCategoryNameBn = 'রড (কেজি)';
            } else if (rawUnitLower.includes('বান্ডিল') || rawUnitLower.includes('bundle')) {
                dbCategoryKey = 'bundle';
                dbCategoryNameBn = 'টিন (বান্ডিল)';
            } else {
                dbCategoryKey = 'others';
                dbCategoryNameBn = 'অন্যান্য মাল';
            }

            console.log('Generated Key:', dbCategoryKey);

            const { data: existingData, error: checkError } = await supabase
                .from('labor_settings')
                .select('id')
                .eq('category_key', dbCategoryKey);

            if (checkError) {
                console.error('Labor Settings Check Error:', checkError);
            } else if (!existingData || existingData.length === 0) {

                const { data, error: insertError } = await supabase
                    .from('labor_settings')
                    .insert([
                        {
                            category_key: dbCategoryKey,
                            category_name_bn: dbCategoryNameBn,
                            rate_per_unit: 0,
                            unloading_rate_per_unit: 0, // নতুন ডিফাইন করা কলাম ডিফ্লট ০ সহ
                            updated_at: new Date().toISOString()
                        }
                    ])
                    .select();

                if (insertError) {
                    console.error('Labor Settings Insert Error:', insertError);
                } else {
                    console.log('✅ Labor Settings Added:', data);
                }
            }
        }

        // 🎯 ৩. ডম ফোকাস ও ফর্ম রিসেট
        if (prodNameInput) {
            prodNameInput.disabled = false;
            prodNameInput.value = '';
        }

        productForm.reset();
        if (prodStockInput) prodStockInput.placeholder = "0";
        if (unloadingCostInput) unloadingCostInput.value = "0"; // খরচ বক্স রিসেট করা

        // ডাটা রিফ্রেশ করা
        await fetchProducts();

        // 🎯 ৪. ইলেকট্রন রানটাইম ফোকাস রিলিজ
        setTimeout(() => {
            window.focus();
            if (prodNameInput) prodNameInput.focus();
        }, 50);

    } catch (err) {
        console.error("Database Operation Error:", err);
        showToast("ডাটা সেভ করতে সমস্যা হয়েছে: " + err.message, true);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "💾 ডাটাবেজে সেভ করুন";
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

// এক্সপোর্ট অবজেক্টে নতুন ফাংশনটি যোগ করে দেওয়া হলো
module.exports = { handleProductSubmit, initInventoryCalculations };