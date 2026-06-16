// ========================================================
// 🛠️ 2. INVENTORY DATABASE OPERATIONS (INSERT/UPDATE)
// ========================================================

const { supabase } = require('../../config/supabaseClient');
const { fetchProducts } = require('./fetch');

async function handleProductSubmit(e, productForm, inputs) {
    e.preventDefault();
    const { showToast } = require('./index');

    const { productSelect, prodNameInput, prodUnitInput, prodStockInput, prodBuyingInput, prodSellingInput } = inputs;

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
            // এক্সিস্টিং限界 প্রোডাক্টের স্টক আপডেট
            const existingProd = (window.cachedProducts || []).find(p => p.id === parseInt(selectedId));
            const finalStock = parseFloat(existingProd ? existingProd.current_stock : 0) + newStock;

            const { error } = await supabase
                .from('products')
                .update({
                    current_stock: finalStock,
                    buying_price: buyingPrice,
                    default_selling_price: sellingPrice,
                    unit: unit
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
                    default_selling_price: sellingPrice
                }]);

            if (error) throw error;
            showToast(`🎉 নতুন প্রোডাক্ট "${name}" সেভ হয়েছে!`);
        }

        // 🎯 ২. লেবার সেটিংসে ইউনিটের অটো-রেজিস্ট্রেশন লজিক (১০০% পারফেক্ট ম্যাপিং)
        // ========================================================
        // LABOR SETTINGS AUTO INSERT
        // ========================================================
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

module.exports = { handleProductSubmit };