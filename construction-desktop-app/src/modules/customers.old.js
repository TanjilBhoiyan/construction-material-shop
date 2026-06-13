// const { supabase } = require('../config/supabaseClient');

// let currentCustomerPage = 1;
// const itemsPerPage = 20;
// let isSearching = false; // 🔍 সার্চ ট্র্যাকিং ভ্যারিয়েবল

// async function fetchCustomers(searchQuery = '') {
//     const customerTbody = document.getElementById('customer-tbody');
//     const pageInfo = document.getElementById('customer-page-info'); 

//     try {
//         if (!customerTbody) return;

//         // ১. টোটাল মার্কেট বকেয়া ক্যালকুলেশন (সবসময় আগের মতোই লাইভ থাকবে)
//         const { data: dueSummary, error: sumError } = await supabase
//             .from('customers')
//             .select('total_due');

//         let totalMarketDue = 0;
//         if (!sumError && dueSummary) {
//             totalMarketDue = dueSummary.reduce((sum, item) => sum + (item.total_due || 0), 0);
//         }

//         let query = supabase.from('customers').select('*');
        
//         // 🔍 ২. সার্চ কুয়েরি থাকলে ফিল্টার অ্যাপ্লাই করো, না থাকলে রেগুলার পেজিনেশন
//         if (searchQuery.trim() !== '') {
//             isSearching = true;
//             // নাম অথবা মোবাইল নাম্বারের সাথে মিল খুঁজবে (Case-insensitive)
//             query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
//         } else {
//             isSearching = false;
//             const from = (currentCustomerPage - 1) * itemsPerPage;
//             const to = from + itemsPerPage - 1;
//             query = query.order('created_at', { ascending: false }).range(from, to);
//         }

//         let { data: customers, error } = await query;                          

//         if (error) throw error;

//         customerTbody.innerHTML = '';

//         if (!customers || customers.length === 0) {
//             customerTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">কোনো কাস্টমার পাওয়া যায়নি।</td></tr>`;
//             const marketDueElem = document.getElementById('total-market-due');
//             if (marketDueElem) marketDueElem.innerText = totalMarketDue.toFixed(2);
//             setupPaginationButtons(false);
//             return;
//         }

//         window.cachedCustomers = customers;

//         // 🎯 ৩. কাস্টমার ডাটা আলাদা আলাদা কলামে রেন্ডার করা
//         customers.forEach(cust => {
//             const row = document.createElement('tr');
//             const dueColor = cust.total_due > 0 ? 'text-red-600 font-bold' : 'text-gray-500';
//             const currentAddress = cust.customer_address || cust.address || '—';

//             row.innerHTML = `
//                 <td class="px-4 py-3 border-b font-medium text-gray-800">${cust.name}</td>
//                 <td class="px-4 py-3 border-b text-gray-600">${cust.father_name || '—'}</td> 
//                 <td class="px-4 py-3 border-b text-gray-600">${cust.phone || 'N/A'}</td>
//                 <td class="px-4 py-3 border-b text-gray-600">${currentAddress}</td>    
//                 <td class="px-4 py-3 border-b ${dueColor}">৳${cust.total_due.toFixed(2)}</td>
//                 <td class="px-4 py-3 border-b text-center">
//                     <button onclick="triggerPaymentModal(${cust.id})" class="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded shadow-sm font-medium">💵 টাকা জমা নিন</button>
//                 </td>
//             `;
//             customerTbody.appendChild(row);
//         });

//         const marketDueElem = document.getElementById('total-market-due');
//         if (marketDueElem) marketDueElem.innerText = totalMarketDue.toFixed(2);

//         // 🔍 ৪. সার্চিং অবস্থায় থাকলে পেজিনেশন টেক্সট হাইড/লক করা
//         if (isSearching) {
//             if (pageInfo) pageInfo.innerText = `সার্চ রেজাল্ট: ${customers.length} জন`;
//             setupPaginationButtons(false);
//         } else {
//             if (pageInfo) pageInfo.innerText = `পেজ: ${currentCustomerPage}`;
//             setupPaginationButtons(customers.length === itemsPerPage);
//         }

//     } catch (err) {
//         console.error("Customer ledger loading failed:", err.message);
//     }
// }

// function setupPaginationButtons(hasNextPage) {
//     const prevBtn = document.getElementById('customer-prev-btn');
//     const nextBtn = document.getElementById('customer-next-btn');

//     // সার্চ চলাকালীন নেক্সট/প্রিভিয়াস বাটন ডিজেবল থাকবে
//     if (prevBtn) prevBtn.disabled = isSearching ? true : currentCustomerPage === 1;
//     if (nextBtn) nextBtn.disabled = isSearching ? true : !hasNextPage;
// }

// function initCustomerModule() {
//     // 🔍 ৫. লাইভ সার্চ ইনপুট ইভেন্ট লিসেনার যোগ করা
//     const searchInput = document.getElementById('customer-search-input');
//     if (searchInput && !searchInput.dataset.listenerAttached) {
//         let debounceTimer;
//         searchInput.addEventListener('input', (e) => {
//             // সুপাবেজে ঘন ঘন রিকোয়েস্ট যাওয়া আটকাতে ছোট ডিবান্স টাইমার
//             clearTimeout(debounceTimer);
//             debounceTimer = setTimeout(async () => {
//                 currentCustomerPage = 1; // সার্চ করলে আবার ১ম পেজ থেকে দেখাবে
//                 await fetchCustomers(e.target.value);
//             }, 150); // কাস্টমার টাইপ করা থামানোর ৩০০ মিলি-সেকেন্ড পর সার্চ হবে
//         });
//         searchInput.dataset.listenerAttached = "true";
//     }

//     window.triggerPaymentModal = function (id) {
//         if (!window.cachedCustomers) return;
//         const cust = window.cachedCustomers.find(c => c.id === id);
//         if (cust) {
//             window.openPaymentModal(cust.id, cust.name, cust.total_due, cust.father_name, (cust.customer_address || cust.address));
//         }
//     }

//     window.openPaymentModal = function (id, name, totalDue, fatherName, address) {
//         const paymentModal = document.getElementById('payment-modal');
//         const modalCustId = document.getElementById('modal-cust-id');
//         const modalCustName = document.getElementById('modal-cust-name');
//         const modalCustDue = document.getElementById('modal-cust-due');
//         const modalPayAmount = document.getElementById('modal-pay-amount');

//         if (!paymentModal || !modalCustName) return;

//         modalCustId.value = id;
//         modalCustDue.innerText = `৳${parseFloat(totalDue).toFixed(2)}`;
//         modalPayAmount.value = '';

//         const fStr = fatherName ? ` <span class="text-sm font-normal text-gray-600">(পিতা: ${fatherName})</span>` : '';
//         const aStr = address ? `<div class="text-xs text-gray-500 font-normal mt-1">🏠 ঠিকানা: ${address}</div>` : '';
//         modalCustName.innerHTML = `<span class="font-bold text-base">${name}</span>${fStr}${aStr}`;

//         paymentModal.classList.remove('hidden');
//     }

//     // পেজিনেশন ক্লিক ইভেন্ট
//     const prevBtn = document.getElementById('customer-prev-btn');
//     const nextBtn = document.getElementById('customer-next-btn');

//     if (prevBtn && !prevBtn.dataset.listenerAttached) {
//         prevBtn.addEventListener('click', async () => {
//             if (currentCustomerPage > 1 && !isSearching) {
//                 currentCustomerPage--;
//                 await fetchCustomers();
//             }
//         });
//         prevBtn.dataset.listenerAttached = "true";
//     }

//     if (nextBtn && !nextBtn.dataset.listenerAttached) {
//         nextBtn.addEventListener('click', async () => {
//             if (!isSearching) {
//                 currentCustomerPage++;
//                 await fetchCustomers();
//             }
//         });
//         nextBtn.dataset.listenerAttached = "true";
//     }

//     // মডাল সাবমিট ও ক্লোজ লজিক
//     if (!window.customerListenersSet) {
//         document.addEventListener('click', async function (e) {
//             if (e.target && e.target.id === 'close-modal-btn') {
//                 const paymentModal = document.getElementById('payment-modal');
//                 if (paymentModal) paymentModal.classList.add('hidden');
//             }

//             if (e.target && e.target.id === 'submit-payment-btn') {
//                 const submitBtn = e.target;
//                 const modalCustId = document.getElementById('modal-cust-id');
//                 const modalCustDue = document.getElementById('modal-cust-due');
//                 const modalPayAmount = document.getElementById('modal-pay-amount');
//                 const paymentModal = document.getElementById('payment-modal');

//                 const custId = modalCustId.value;
//                 const payAmount = parseFloat(modalPayAmount.value) || 0;
//                 const currentDue = parseFloat(modalCustDue.innerText.replace('৳', '')) || 0;

//                 const showToast = (message, isError = false) => {
//                     const oldToast = document.getElementById('app-toast');
//                     if (oldToast) oldToast.remove();

//                     const toast = document.createElement('div');
//                     toast.id = 'app-toast';
//                     toast.innerText = message;
//                     toast.className = `fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 ${isError ? 'bg-red-600' : 'bg-green-600'}`;
//                     document.body.appendChild(toast);

//                     setTimeout(() => {
//                         toast.style.opacity = '0';
//                         setTimeout(() => toast.remove(), 300);
//                     }, 3000);
//                 };

//                 if (payAmount <= 0) {
//                     showToast("দয়া করে সঠিক জমার পরিমাণ লিখুন।", true);
//                     return;
//                 }

//                 if (payAmount > currentDue) {
//                     showToast(`বকেয়ার চেয়ে বেশি টাকা জমা নেওয়া যাবে না। বর্তমান বকেয়া: ৳${currentDue.toFixed(2)}`, true);
//                     return;
//                 }

//                 try {
//                     submitBtn.disabled = true;
//                     submitBtn.innerText = "⏳ প্রসেস হচ্ছে...";

//                     const { error: paymentErr } = await supabase
//                         .from('customer_payments')
//                         .insert([{ customer_id: custId, amount_paid: payAmount }]);

//                     if (paymentErr) throw paymentErr;

//                     const updatedDue = currentDue - payAmount;

//                     const { error: custUpdateErr } = await supabase
//                         .from('customers')
//                         .update({ total_due: updatedDue })
//                         .eq('id', custId);

//                     if (custUpdateErr) throw custUpdateErr;

//                     showToast(`🎉 ৳${payAmount.toFixed(2)} সফলভাবে জমা নেওয়া হয়েছে!`);
//                     if (paymentModal) paymentModal.classList.add('hidden');

//                     // রিলোড করার সময় যদি ইনপুটে কোনো লেখা থাকে তবে সেটা দিয়েই রি-ফিল্টার করবে
//                     const currentSearchVal = document.getElementById('customer-search-input')?.value || '';
//                     await fetchCustomers(currentSearchVal);

//                     setTimeout(() => {
//                         window.focus();
//                         document.body.focus();
//                     }, 50);

//                 } catch (err) {
//                     showToast("টাকা জমা নিতে সমস্যা হয়েছে: " + err.message, true);
//                 } finally {
//                     if (submitBtn) {
//                         submitBtn.disabled = false;
//                         submitBtn.innerHTML = "জমা নিশ্চিত করুন";
//                     }
//                 }
//             }
//         });
//         window.customerListenersSet = true;
//     }
// }

// module.exports = { fetchCustomers, initCustomerModule };