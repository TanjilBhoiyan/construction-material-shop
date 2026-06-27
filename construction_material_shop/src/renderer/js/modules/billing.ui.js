// src/renderer/js/modules/billing.ui.js
const { supabase } = require('../../../shared/config/supabaseClient');

const BillingUI = {
    cart: [],

    render(container) {
        console.log("Billing UI Initialized");
        this.loadProductsForBilling();
        this.initEventListeners();
    },

    async loadProductsForBilling() {
        const select = document.getElementById('bill-prod-select');
        const { data } = await supabase.from('products').select('id, name, selling_price');
        
        if (data) {
            select.innerHTML = '<option value="">প্রোডাক্ট বাছুন</option>' + 
                data.map(p => `<option value="${p.id}" data-price="${p.selling_price}">${p.name}</option>`).join('');
        }
    },

    initEventListeners() {
        // প্রোডাক্ট বাছলে রেট অটোমেটিক বসানো
        document.getElementById('bill-prod-select').addEventListener('change', (e) => {
            const price = e.target.options[e.target.selectedIndex].dataset.price;
            document.getElementById('bill-prod-rate').value = price || '';
        });

        // কার্টে যোগ করা
        document.getElementById('add-to-cart-btn').addEventListener('click', () => {
            this.addToCart();
        });

        // টোটাল ক্যালকুলেট করা (অটোমেটিক)
        document.addEventListener('input', (e) => {
            if(['summary-labor-cost', 'summary-transport-cost', 'summary-cash-paid'].includes(e.target.id)) {
                this.calculateTotal();
            }
        });
    },

    addToCart() {
        // এখানে কার্টে প্রোডাক্ট যোগ করার লজিক লিখুন
        // তারপর টেবিল রেন্ডার করুন এবং calculateTotal() কল করুন
    },

    calculateTotal() {
        // এখানে সব যোগ বিয়োগ করে summary-total-payable এবং due হিসাব করুন
    }
};

module.exports = { BillingUI };