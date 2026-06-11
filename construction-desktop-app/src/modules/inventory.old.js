// const { supabase } = require('../config/supabaseClient');

// // গ্লোবাল ভ্যারিয়েবল ক্যাশ রাখার জন্য
// window.cachedProducts = [];

// // স্ক্রিনে সুন্দর নোটিফিকেশন দেখানোর জন্য একটি হেল্পার ফাংশন (অ্যালার্টের বিকল্প)
// function showToast(message, isError = false) {
//     // আগের কোনো টোস্ট থাকলে তা রিমুভ করা
//     const oldToast = document.getElementById('app-toast');
//     if (oldToast) oldToast.remove();

//     const toast = document.createElement('div');
//     toast.id = 'app-toast';
//     toast.innerText = message;
    
//     // টেইলউইন্ড সিএসএস দিয়ে সুন্দর নোটিফিকেশন স্টাইল
//     toast.className = `fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transition-all duration-300 ${
//         isError ? 'bg-red-600' : 'bg-green-600'
//     }`;
    
//     document.body.appendChild(toast);
    
//     // ৩ সেকেন্ড পর অটোমেটিক গায়েব হয়ে যাবে
//     setTimeout(() => {
//         toast.style.opacity = '0';
//         setTimeout(() => toast.remove(), 300);
//     }, 3000);
// }

// async function fetchProducts() {
//     const productTbody = document.getElementById('product-tbody') || document.querySelector('tbody');
//     const productSelect = document.getElementById('product-select');
    
//     try {
//         let { data: products, error } = await supabase
//             .from('products')
//             .select('*')
//             .order('name', { ascending: true });

//         if (error) throw error;

//         window.cachedProducts = products || [];

//         // ১. টেবিল ভিউ আপডেট
//         if (productTbody) {
//             productTbody.innerHTML = '';
//             if (window.cachedProducts.length === 0) {
//                 productTbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">কোনো প্রোডাক্ট পাওয়া যায়নি।</td></tr>`;
//             } else {
//                 window.cachedProducts.forEach(prod => {
//                     const stockVal = prod.current_stock !== undefined ? prod.current_stock : 0;
//                     const buyingVal = prod.buying_price !== undefined ? prod.buying_price : 0;
//                     const sellingVal = prod.default_selling_price !== undefined ? prod.default_selling_price : 0;
//                     const unitVal = prod.unit || '';

//                     const row = document.createElement('tr');
//                     row.innerHTML = `
//                         <td class="px-4 py-2 border-b text-gray-800">${prod.name}</td>
//                         <td class="px-4 py-2 border-b text-blue-600 font-semibold">${stockVal} ${unitVal}</td>
//                         <td class="px-4 py-2 border-b text-gray-600">৳${parseFloat(buyingVal).toFixed(2)}</td>
//                         <td class="px-4 py-2 border-b text-green-600 font-medium">৳${parseFloat(sellingVal).toFixed(2)}</td>
//                     `;
//                     productTbody.appendChild(row);
//                 });
//             }
//         }

//         // ২. ড্রপডাউন মেনু আপডেট
//         if (productSelect) {
//             productSelect.innerHTML = '<option value="">-- নতুন প্রোডাক্ট (নিচে নাম লিখুন) --</option>';
//             window.cachedProducts.forEach(prod => {
//                 const stockVal = prod.current_stock !== undefined ? prod.current_stock : 0;
//                 const unitVal = prod.unit || '';
//                 const option = document.createElement('option');
//                 option.value = prod.id;
//                 option.text = `${prod.name} (স্টক: ${stockVal} ${unitVal})`;
//                 productSelect.appendChild(option);
//             });
//         }

//     } catch (err) {
//         console.error("Product loading failed:", err.message);
//     }
// }

// function initProductForm() {
//     const productForm = document.getElementById('product-form') || document.querySelector('form');
//     const productSelect = document.getElementById('product-select');
    
//     const prodNameInput = document.getElementById('prod-name') || document.querySelector('input[placeholder*="BSRM"]') || document.querySelectorAll('form input')[0];
//     const prodUnitInput = document.getElementById('prod-unit') || document.querySelector('form select:not(#product-select)') || document.querySelectorAll('form select')[0];
//     const prodStockInput = document.getElementById('prod-stock') || document.querySelector('form input[type="number"]') || document.querySelectorAll('form input')[1];
    
//     const allInputs = document.querySelectorAll('form input');
//     let prodBuyingInput = document.getElementById('prod-buying');
//     let prodSellingInput = document.getElementById('prod-selling');
    
//     if (!prodBuyingInput && allInputs.length >= 4) {
//         prodBuyingInput = allInputs[allInputs.length - 2]; 
//         prodSellingInput = allInputs[allInputs.length - 1]; 
//     }

//     if (!productForm) {
//         console.error("Form element could not be resolved!");
//         return;
//     }

//     // ড্রপডাউন সিলেক্ট ইভেন্ট
//     if (productSelect) {
//         productSelect.addEventListener('change', function() {
//             const selectedId = parseInt(this.value);
//             if (selectedId && window.cachedProducts.length > 0) {
//                 const prod = window.cachedProducts.find(p => p.id === selectedId);
//                 if (prod) {
//                     if (prodNameInput) { prodNameInput.value = prod.name; prodNameInput.disabled = true; }
//                     if (prodUnitInput) prodUnitInput.value = prod.unit;
//                     if (prodBuyingInput) prodBuyingInput.value = prod.buying_price;
//                     if (prodSellingInput) prodSellingInput.value = prod.default_selling_price;
//                     if (prodStockInput) { prodStockInput.value = ''; prodStockInput.placeholder = "নতুন চালানের স্টক লিখুন"; }
//                 }
//             } else {
//                 if (prodNameInput) { prodNameInput.value = ''; prodNameInput.disabled = false; }
//                 if (prodUnitInput) prodUnitInput.selectedIndex = 0;
//                 if (prodBuyingInput) prodBuyingInput.value = '';
//                 if (prodSellingInput) prodSellingInput.value = '';
//                 if (prodStockInput) { prodStockInput.value = ''; prodStockInput.placeholder = "0"; }
//             }
//         });
//     }

//     // ==========================================
//     // 🛠️ ফর্ম সাবমিট (ডাটাবেজে সেভ/আপডেট) লজিক [মাউস লক ফিক্সড]
//     // ==========================================
//     productForm.addEventListener('submit', async function(e) {
//         e.preventDefault();

//         // ১. সাবমিট বাটনটি ডিজেবল করে দেওয়া যাতে ডাবল এন্ট্রি না হয়
//         const submitBtn = productForm.querySelector('button[type="submit"]');
//         if (submitBtn) {
//             submitBtn.disabled = true;
//             submitBtn.innerText = "⏳ ডাটা সেভ হচ্ছে...";
//             submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
//         }

//         const selectedId = productSelect ? productSelect.value : "";
//         const name = prodNameInput ? prodNameInput.value.trim() : "";
//         const unit = prodUnitInput ? prodUnitInput.value : "";
//         const newStock = parseFloat(prodStockInput ? prodStockInput.value : 0) || 0;
//         const buyingPrice = parseFloat(prodBuyingInput ? prodBuyingInput.value : 0) || 0;
//         const sellingPrice = parseFloat(prodSellingInput ? prodSellingInput.value : 0) || 0;

//         if (!name || newStock <= 0 || buyingPrice <= 0 || sellingPrice <= 0) {
//             showToast("দয়া করে সব ঘর সঠিকভাবে পূরণ করুন!", true);
//             // বাটন আবার সচল করা
//             if (submitBtn) {
//                 submitBtn.disabled = false;
//                 submitBtn.innerHTML = "💾 ডাটাবেজে সেভ করুন";
//                 submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
//             }
//             return;
//         }

//         try {
//             if (selectedId) {
//                 const existingProd = window.cachedProducts.find(p => p.id === parseInt(selectedId));
//                 const finalStock = parseFloat(existingProd ? existingProd.current_stock : 0) + newStock;

//                 const { error } = await supabase
//                     .from('products')
//                     .update({ 
//                         current_stock: finalStock, 
//                         buying_price: buyingPrice, 
//                         default_selling_price: sellingPrice, 
//                         unit: unit 
//                     })
//                     .eq('id', selectedId);

//                 if (error) throw error;
//                 showToast(`🎉 ${name}-এর স্টক সফলভাবে আপডেট হয়েছে!`);
//             } else {
//                 const isDuplicate = window.cachedProducts.some(p => p.name.toLowerCase() === name.toLowerCase());
//                 if (isDuplicate) {
//                     showToast("এই নামের প্রোডাক্ট অলরেডি আছে!", true);
//                     if (submitBtn) {
//                         submitBtn.disabled = false;
//                         submitBtn.innerHTML = "💾 ডাটাবেজে সেভ করুন";
//                         submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
//                     }
//                     return;
//                 }

//                 const { error } = await supabase
//                     .from('products')
//                     .insert([{ 
//                         name, 
//                         unit, 
//                         current_stock: newStock, 
//                         buying_price: buyingPrice, 
//                         default_selling_price: sellingPrice 
//                     }]);

//                 if (error) throw error;
//                 showToast(`🎉 নতুন প্রোডাক্ট "${name}" সেভ হয়েছে!`);
//             }

//             // 🎯 ২. ডম ফোকাস ও মাউস লক রিলিজ করার ক্লিয়ারেন্স সাইকেল
//             if (prodNameInput) {
//                 prodNameInput.disabled = false;
//                 prodNameInput.value = '';
//             }
            
//             // ফর্ম পুরোপুরি ক্লিয়ার করা
//             productForm.reset();
//             if (prodStockInput) prodStockInput.placeholder = "0";

//             // ডাটা রিফ্রেশ করা
//             await fetchProducts();

//             // 🎯 ৩. ইলেকট্রন রানটাইমকে জোর করে মাউস ট্র্যাক ফিরিয়ে দেওয়া
//             setTimeout(() => {
//                 window.focus();
//                 if (prodNameInput) prodNameInput.focus(); // সরাসরি কার্সার আবার প্রথম বক্সে চলে যাবে
//             }, 50);

//         } catch (err) {
//             showToast("ডাটা সেভ করতে সমস্যা হয়েছে: " + err.message, true);
//         } finally {
//             // ৪. কাজ শেষ হওয়ার পর বাটনকে সম্পূর্ণ আগের অবস্থায় ফেরত আনা
//             if (submitBtn) {
//                 submitBtn.disabled = false;
//                 submitBtn.innerHTML = "💾 ডাটাবেজে সেভ করুন";
//                 submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
//             }
//         }
//     });
// }

// module.exports = { fetchProducts, initProductForm };