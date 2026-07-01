// ========================================================
// 📦 1. INVENTORY DATA FETCH (Controller Layer)
// ========================================================

const { InventoryService } = require('./inventory.service');

// গ্লোবাল ক্যাশ ভেরিয়েবল
window.cachedProducts = [];

async function fetchProducts() {
    const productTbody = document.getElementById('product-tbody') || document.querySelector('tbody');
    const productSelect = document.getElementById('product-select');
    
    try {
        // ১. সার্ভিস লেয়ার থেকে ক্লিন ডাটা নিয়ে আসা
        const products = await InventoryService.getFormattedProducts();
        window.cachedProducts = products;

        // ২. টেবিল ভিউ আপডেট
        if (productTbody) {
            productTbody.innerHTML = '';
            if (window.cachedProducts.length === 0) {
                productTbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">কোনো প্রোডাক্ট পাওয়া যায়নি।</td></tr>`;
            } else {
                window.cachedProducts.forEach(prod => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-4 py-2 border-b text-gray-800">${prod.name}</td>
                        <td class="px-4 py-2 border-b text-blue-600 font-semibold">${prod.current_stock} ${prod.unit}</td>
                        <td class="px-4 py-2 border-b text-gray-600">৳${prod.buying_price.toFixed(2)}</td>
                        <td class="px-4 py-2 border-b text-green-600 font-medium">৳${prod.default_selling_price.toFixed(2)}</td>
                    `;
                    productTbody.appendChild(row);
                });
            }
        }

        // ৩. ড্রপডাউন মেনু আপডেট
        if (productSelect) {
            productSelect.innerHTML = '<option value="">-- নতুন প্রোডাক্ট (নিচে নাম লিখুন) --</option>';
            window.cachedProducts.forEach(prod => {
                const option = document.createElement('option');
                option.value = prod.id;
                option.text = `${prod.name} (স্টক: ${prod.current_stock} ${prod.unit})`;
                productSelect.appendChild(option);
            });
        }

    } catch (err) {
        console.error("Product loading failed:", err.message);
    }
}

module.exports = { fetchProducts };