// const { supabase } = require('../config/supabaseClient');

// // বিলিং মডিউলের জন্য লোকাল কার্ট স্টেট
// let cart = [];
// let globalProducts = []; // ডাটাবেজের প্রোডাক্ট সাময়িকভাবে রাখার জন্য

// // DOM Elements (ফাংশনের ভেতর ডাইনামিকালি সিলেক্ট করা হবে)
// let billProdSelect, billProdQty, billProdRate, addToCartBtn, cartTbody;
// let summarySubtotal, summaryExtraCost, summaryCostBearer, summaryTotalPayable, summaryCashPaid, summaryCalculatedDue, checkoutBillBtn;

// // 🔄 ডাটাবেজ থেকে বিলিং পেজের প্রোডাক্ট ড্রপডাউন লোড করা এবং লাইভ রেট শো করা
// async function populateBillingDropdown() {
//     try {
//         billProdSelect = document.getElementById('bill-prod-select');
//         billProdRate = document.getElementById('bill-prod-rate');
        
//         if (!billProdSelect) return;

//         let { data: products, error } = await supabase.from('products').select('*').order('name', { ascending: true });
//         if (error) throw error;
        
//         globalProducts = products; 
//         window.cachedProducts = products; // গ্লোবাল ক্যাশেও ব্যাকআপ রাখা হলো
        
//         billProdSelect.innerHTML = '';
        
//         products.forEach(prod => {
//             const opt = document.createElement('option');
//             opt.value = prod.id;
//             opt.innerText = `${prod.name} (স্টক: ${prod.current_stock} ${prod.unit || ''})`;
//             billProdSelect.appendChild(opt);
//         });

//         // প্রথম প্রোডাক্টের রেট ফিল্ড অটো-পপুলেট করা
//         if (products.length > 0) {
//             updateRateField(products[0].id);
//         }

//     } catch (err) {
//         console.error("Dropdown loading failed:", err.message);
//     }
// }

// // সিলেক্টেড প্রোডাক্ট অনুযায়ী রেট ফিল্ড আপডেট
// function updateRateField(productId) {
//     billProdRate = document.getElementById('bill-prod-rate');
//     if (!globalProducts || globalProducts.length === 0) {
//         if (window.cachedProducts) globalProducts = window.cachedProducts;
//     }
//     const selectedProd = globalProducts.find(p => p.id == productId);
//     if (selectedProd && billProdRate) {
//         billProdRate.value = selectedProd.default_selling_price; 
//     }
// }

// // 🧮 রিয়েল-টাইম বিল হিসাব ক্যালকুলেশন লজিক (আপনার অরিজিনাল কোড 🎯)
// function calculateBillSummary() {
//     summarySubtotal = document.getElementById('summary-subtotal');
//     summaryExtraCost = document.getElementById('summary-extra-cost');
//     summaryCostBearer = document.getElementById('summary-cost-bearer');
//     summaryTotalPayable = document.getElementById('summary-total-payable');
//     summaryCashPaid = document.getElementById('summary-cash-paid');
//     summaryCalculatedDue = document.getElementById('summary-calculated-due');

//     if (!summarySubtotal) return;

//     const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
//     summarySubtotal.innerText = subtotal.toFixed(2);

//     const extraCost = parseFloat(summaryExtraCost ? summaryExtraCost.value : 0) || 0;
//     const bearer = summaryCostBearer ? summaryCostBearer.value : 'none';

//     let totalPayable = subtotal;
//     if (bearer === 'customer') {
//         totalPayable += extraCost;
//     }

//     if (summaryTotalPayable) summaryTotalPayable.innerText = totalPayable.toFixed(2);

//     const cashPaid = parseFloat(summaryCashPaid ? summaryCashPaid.value : 0) || 0;
//     const due = totalPayable - cashPaid;
//     if (summaryCalculatedDue) summaryCalculatedDue.innerText = due.toFixed(2);
// }

// // 🛒 কার্ট টেবিল রেন্ডার করা
// function renderCart() {
//     cartTbody = document.getElementById('cart-tbody');
//     if (!cartTbody) return;

//     cartTbody.innerHTML = '';
//     cart.forEach((item, index) => {
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td class="px-4 py-2 border-b font-semibold text-gray-800">${item.name}</td>
//             <td class="px-4 py-2 border-b text-blue-600">${item.quantity} ${item.unit}</td>
//             <td class="px-4 py-2 border-b">৳${item.price_per_unit}</td>
//             <td class="px-4 py-2 border-b font-semibold text-gray-700">৳${item.total_price.toFixed(2)}</td>
//             <td class="px-4 py-2 border-b text-center">
//                 <button onclick="window.removeFromCart(${index})" class="text-red-500 hover:text-red-700 font-bold">❌ বাদ দিন</button>
//             </td>
//         `;
//         cartTbody.appendChild(row);
//     });

//     // কার্ট রেন্ডার হওয়ার সাথে সাথে হিসাব আপডেট হবে (প্রোডাক্ট বাদ দেওয়ার গ্লিচ ফিক্স)
//     calculateBillSummary();
// }

// // কার্ট থেকে আইটেম রিমুভ করার গ্লোবাল উইন্ডো ফাংশন
// window.removeFromCart = function(index) {
//     cart.splice(index, 1);
//     renderCart();
// }

// // 🛒 কার্টে আইটেম যোগ করা (Add to Cart)
// function handleAddToCart() {
//     billProdSelect = document.getElementById('bill-prod-select');
//     billProdQty = document.getElementById('bill-prod-qty');
//     billProdRate = document.getElementById('bill-prod-rate');

//     const prodId = billProdSelect ? billProdSelect.value : null;
//     const qty = parseFloat(billProdQty ? billProdQty.value : 0) || 0;
//     const rate = parseFloat(billProdRate ? billProdRate.value : 0) || 0;

//     if (!prodId || qty <= 0 || rate <= 0) {
//         alert("দয়া করে সঠিক প্রোডাক্ট, পরিমাণ এবং রেট দিন।");
//         return;
//     }

//     if (!globalProducts || globalProducts.length === 0) {
//         if (window.cachedProducts) globalProducts = window.cachedProducts;
//     }

//     const item = globalProducts.find(p => p.id == prodId);
//     if (!item) return;
    
//     // কার্টে অলরেডি আইটেমটি থাকলে পরিমাণ বাড়িয়ে দেওয়া, ডুপ্লিকেট রোধে
//     const existingIndex = cart.findIndex(c => c.product_id == prodId);
//     if (existingIndex > -1) {
//         cart[existingIndex].quantity += qty;
//         cart[existingIndex].total_price = cart[existingIndex].quantity * cart[existingIndex].price_per_unit;
//     } else {
//         const cartItem = {
//             product_id: item.id,
//             name: item.name,
//             unit: item.unit,
//             quantity: qty,
//             price_per_unit: rate,
//             total_price: qty * rate
//         };
//         cart.push(cartItem);
//     }

//     renderCart();
    
//     // ইনপুট ফিল্ড রিসেট
//     if (billProdQty) billProdQty.value = '1';
// }
// function showToast(message) {
//     const oldToast = document.getElementById('app-toast');
//     if (oldToast) oldToast.remove();

//     const toast = document.createElement('div');
//     toast.id = 'app-toast';
//     toast.innerText = message;

//     toast.className =
//         'fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg text-white bg-green-600 z-50';

//     document.body.appendChild(toast);

//     setTimeout(() => {
//         toast.remove();
//     }, 3000);
// }
// // 💵 ইনভয়েস কনফার্ম ও কাস্টমার লেজার লজিক
// async function handleCheckout() {
//     if (cart.length === 0) {
//         alert("কার্ট খালি! দয়া করে অন্তত একটি প্রোডাক্ট যোগ করুন।");
//         return;
//     }

//     const customerName = document.getElementById('bill-cust-name').value.trim() || "Unknown Customer";
//     const customerPhone = document.getElementById('bill-cust-phone').value.trim() || "";
    
//     summarySubtotal = document.getElementById('summary-subtotal');
//     summaryExtraCost = document.getElementById('summary-extra-cost');
//     summaryCostBearer = document.getElementById('summary-cost-bearer');
//     summaryTotalPayable = document.getElementById('summary-total-payable');
//     summaryCashPaid = document.getElementById('summary-cash-paid');
//     summaryCalculatedDue = document.getElementById('summary-calculated-due');

//     const extraCost = parseFloat(summaryExtraCost ? summaryExtraCost.value : 0) || 0;
//     const bearer = summaryCostBearer ? summaryCostBearer.value : 'none';
//     const subtotal = parseFloat(summarySubtotal ? summarySubtotal.innerText : 0) || 0;
//     const totalPayable = parseFloat(summaryTotalPayable ? summaryTotalPayable.innerText : 0) || 0;
//     const cashPaid = parseFloat(summaryCashPaid ? summaryCashPaid.value : 0) || 0;
//     const due = parseFloat(summaryCalculatedDue ? summaryCalculatedDue.innerText : 0) || 0;

//     try {
//         // ১. প্রোডাক্টের স্টক চেক ও মাইনাস লজিক
//         for (const item of cart) {
//             let { data: currentProd, error: fetchErr } = await supabase
//                 .from('products')
//                 .select('current_stock')
//                 .eq('id', item.product_id)
//                 .single();

//             if (fetchErr) throw fetchErr;

//             if (currentProd.current_stock < item.quantity) {
//                 alert(`দুঃখিত! ${item.name}-এর পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${currentProd.current_stock}`);
//                 return;
//             }

//             const updatedStock = currentProd.current_stock - item.quantity;
//             let { error: updateErr } = await supabase
//                 .from('products')
//                 .update({ current_stock: updatedStock })
//                 .eq('id', item.product_id);

//             if (updateErr) throw updateErr;
//         }

//         // ২. কাস্টমার লেজার সিঙ্ক লজিক 🎯
//         if (customerPhone !== "") {
//             let { data: existingCustomer, error: custFetchErr } = await supabase
//                 .from('customers')
//                 .select('*')
//                 .eq('phone', customerPhone)
//                 .maybeSingle();

//             if (custFetchErr) throw custFetchErr;

//             if (existingCustomer) {
//                 const newTotalDue = existingCustomer.total_due + due;
//                 let { error: custUpdateErr } = await supabase
//                     .from('customers')
//                     .update({ total_due: newTotalDue, name: customerName }) 
//                     .eq('id', existingCustomer.id);

//                 if (custUpdateErr) throw custUpdateErr;
//             } else {
//                 let { error: custInsertErr } = await supabase
//                     .from('customers')
//                     .insert([{ name: customerName, phone: customerPhone, total_due: due }]);

//                 if (custInsertErr) throw custInsertErr;
//             }
//         }

//         // ৩. sales টেবিলে মেমো সেভ করা
//         const { error: saleErr } = await supabase
//             .from('sales')
//             .insert([
//                 {
//                     customer_name: customerName,
//                     customer_phone: customerPhone,
//                     subtotal: subtotal,
//                     extra_cost: extraCost,
//                     cost_bearer: bearer,
//                     total_payable: totalPayable,
//                     cash_paid: cashPaid,
//                     due_amount: due
//                 }
//             ]);

//         if (saleErr) throw saleErr;

//         //alert(`🎉 বিল সফলভাবে সংরক্ষিত হয়েছে এবং কাস্টমার লেজার আপডেট হয়েছে!`);
//         showToast("🎉বিল সফলভাবে সংরক্ষিত হয়েছে এবং কাস্টমার লেজার আপডেট হয়েছে!");

//         // ৪. ফর্ম ও কার্ট রিসেট
//         cart = [];
//         renderCart();
        
//         if(document.getElementById('bill-cust-name')) document.getElementById('bill-cust-name').value = '';
//         if(document.getElementById('bill-cust-phone')) document.getElementById('bill-cust-phone').value = '';
//         if(summaryExtraCost) summaryExtraCost.value = 0;
//         if(summaryCostBearer) summaryCostBearer.value = 'none';
//         if(summaryCashPaid) summaryCashPaid.value = 0;
        
//         calculateBillSummary();

//         // ইনভেন্টরি ও ড্রপডাউন রিফ্রেশ অ্যাপ ট্রিগার
//         if (typeof window.fetchProducts === 'function') window.fetchProducts();
//         populateBillingDropdown();

//     } catch (err) {
//         alert("সমস্যা হয়েছে: " + err.message);
//     }
// }

// // বিলিং স্ক্রিন ইনিশিয়েট করার মেইন ফাংশন
// function initBillingModule() {
//     billProdSelect = document.getElementById('bill-prod-select');
//     addToCartBtn = document.getElementById('add-to-cart-btn');
//     checkoutBillBtn = document.getElementById('checkout-bill-btn');
    
//     summaryExtraCost = document.getElementById('summary-extra-cost');
//     summaryCostBearer = document.getElementById('summary-cost-bearer');
//     summaryCashPaid = document.getElementById('summary-cash-paid');

//     // প্রথমবার ড্রপডাউন ডাটা লোড করা
//     populateBillingDropdown();

//     // ড্রপডাউন চেঞ্জ ইভেন্ট
//     if (billProdSelect) {
//         billProdSelect.addEventListener('change', (e) => {
//             updateRateField(e.target.value);
//         });
//     }

//     // "যোগ করুন" বাটন ইভেন্ট লিসেনার
//     if (addToCartBtn) {
//         const newAddToCartBtn = addToCartBtn.cloneNode(true);
//         addToCartBtn.parentNode.replaceChild(newAddToCartBtn, addToCartBtn);
//         newAddToCartBtn.addEventListener('click', (e) => {
//             e.preventDefault();
//             handleAddToCart();
//         });
//     }

//     // রিয়েল-টাইম ক্যালকুলেশন ইনপুট লিসেনারসমূহ
//     if (summaryExtraCost) summaryExtraCost.addEventListener('input', calculateBillSummary);
//     if (summaryCostBearer) summaryCostBearer.addEventListener('change', calculateBillSummary);
//     if (summaryCashPaid) summaryCashPaid.addEventListener('input', calculateBillSummary);

//     // ইনভয়েস কনফার্ম বাটন
//     if (checkoutBillBtn) {
//         const newCheckoutBtn = checkoutBillBtn.cloneNode(true);
//         checkoutBillBtn.parentNode.replaceChild(newCheckoutBtn, checkoutBillBtn);
//         newCheckoutBtn.addEventListener('click', (e) => {
//             e.preventDefault();
//             handleCheckout();
//         });
//     }
// }

// module.exports = { initBillingModule, populateBillingDropdown };