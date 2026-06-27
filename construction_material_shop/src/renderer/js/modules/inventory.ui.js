
const { supabase } = require('../../../shared/config/supabaseClient');
// src/renderer/js/modules/inventory.ui.js 

const InventoryUI = {
    // এখানে কোনো HTML লাগবে না, কারণ আপনার রাউটার ইঞ্জিন সেটি আগেই ইনজেক্ট করে ফেলেছে
    render(container) {
        console.log("Inventory UI Initialized");
        this.fetchProducts();
        this.initEventListeners();
    },

    initEventListeners() {
        const form = document.getElementById('product-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveProduct();
            });
        }
    },

    async fetchProducts() {
        const tbody = document.getElementById('product-list-tbody');
        if (!tbody) return;

        const { data, error } = await supabase.from('products').select('*');
        if (!error && data) {
            tbody.innerHTML = data.map(p => `
                <tr>
                    <td class="px-4 py-2 border">${p.name}</td>
                    <td class="px-4 py-2 border">${p.stock}</td>
                    <td class="px-4 py-2 border">${p.buying_price}</td>
                    <td class="px-4 py-2 border">${p.selling_price}</td>
                </tr>
            `).join('');
        }
    },

    async saveProduct() {
        // আপনার আগের HTML এর আইডিগুলো এখানে ব্যবহার করুন
        const name = document.getElementById('prod-name').value;
        const stock = document.getElementById('prod-stock').value;
        const buying = document.getElementById('prod-buying').value;
        const selling = document.getElementById('prod-selling').value;

        const { error } = await supabase.from('products').insert([{ 
            name, stock, buying_price: buying, selling_price: selling 
        }]);

        if (!error) {
            alert("সফলভাবে যোগ হয়েছে!");
            this.fetchProducts();
        }
    }
};

module.exports = { InventoryUI };