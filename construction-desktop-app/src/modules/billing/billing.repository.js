// billing.repository.js
const { supabase } = require('../../config/supabaseClient');

const BillingRepository = {
    async getLaborSettings() {
        return await supabase.from('labor_settings').select('*');
    },
    async getProductStock(productId) {
        return await supabase.from('products').select('current_stock').eq('id', productId).single();
    },
    async updateProductStock(productId, newStock) {
        return await supabase.from('products').update({ current_stock: newStock }).eq('id', productId);
    },
    async getCustomer(phone, name) {
        let query = supabase.from('customers').select('*');
        if (phone) query = query.eq('phone', phone);
        else query = query.eq('name', name);
        return await query.maybeSingle();
    },
    async updateCustomer(id, data) {
        return await supabase.from('customers').update(data).eq('id', id);
    },
    async insertCustomer(data) {
        return await supabase.from('customers').insert([data]);
    },
    async saveSale(saleData) {
        return await supabase.from('sales').insert([saleData]).select();
    },
    async saveSaleItems(items) {
        return await supabase.from('sale_items').insert(items);
    },
    async getProducts() {
        return await supabase.from('products').select('*').order('name', { ascending: true });
    }
};

module.exports = { BillingRepository };