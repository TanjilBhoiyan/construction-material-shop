const { supabase } = require('../shared/config/supabaseClient');

const InventoryRepository = {
    async getAllProducts() {
        return await supabase.from('products').select('*').order('name', { ascending: true });
    },
    async createProduct(data) {
        return await supabase.from('products').insert([data]).select();
    },
    async updateProduct(id, data) {
        return await supabase.from('products').update(data).eq('id', id);
    },
    async getLaborRate(categoryKey) {
        return await supabase.from('labor_settings').select('unloading_rate_per_unit').eq('category_key', categoryKey).single();
    }
};
module.exports = InventoryRepository;