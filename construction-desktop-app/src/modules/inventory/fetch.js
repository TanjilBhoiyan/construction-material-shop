// ========================================================
// 📦 1. INVENTORY DATA FETCH & DOM RENDERING
// ========================================================

const { InventoryRepository } = require('./inventory.repository'); // রিপোজিটরি ইমপোর্ট

window.cachedProducts = [];

async function fetchProducts() {
    const productTbody = document.getElementById('product-tbody') || document.querySelector('tbody');
    const productSelect = document.getElementById('product-select');
    
    try {
        // ১. রিপোজিটরি ব্যবহার করে ডাটা আনা
        const { data: products, error } = await InventoryRepository.getProducts();

        if (error) throw error;

        window.cachedProducts = products || [];

        // ২. টেবিল ভিউ আপডেট
        if (productTbody) {
            productTbody.innerHTML = '';
            if (window.cachedProducts.length === 0) {
                productTbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">কোনো প্রোডাক্ট পাওয়া যায়নি।</td></tr>`;
            } else {
                window.cachedProducts.forEach(prod => {
                    const stockVal = prod.current_stock ?? 0;
                    const buyingVal = prod.buying_price ?? 0;
                    const sellingVal = prod.default_selling_price ?? 0;
                    const unitVal = prod.unit || '';

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-4 py-2 border-b text-gray-800">${prod.name}</td>
                        <td class="px-4 py-2 border-b text-blue-600 font-semibold">${stockVal} ${unitVal}</td>
                        <td class="px-4 py-2 border-b text-gray-600">৳${parseFloat(buyingVal).toFixed(2)}</td>
                        <td class="px-4 py-2 border-b text-green-600 font-medium">৳${parseFloat(sellingVal).toFixed(2)}</td>
                    `;
                    productTbody.appendChild(row);
                });
            }
        }

        // ৩. ড্রপডাউন মেনু আপডেট
        if (productSelect) {
            productSelect.innerHTML = '<option value="">-- নতুন প্রোডাক্ট (নিচে নাম লিখুন) --</option>';
            window.cachedProducts.forEach(prod => {
                const stockVal = prod.current_stock ?? 0;
                const unitVal = prod.unit || '';
                const option = document.createElement('option');
                option.value = prod.id;
                option.text = `${prod.name} (স্টক: ${stockVal} ${unitVal})`;
                productSelect.appendChild(option);
            });
        }

    } catch (err) {
        console.error("Product loading failed:", err.message);
    }
}

module.exports = { fetchProducts };