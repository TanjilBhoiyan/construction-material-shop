// customer.repository.js
const { supabase } = require('../../config/supabaseClient');

const CustomerRepository = {
    // ১. কাস্টমারের সেলস ডাটা আনা
    async getSalesByCustomer(phone, name) {
        let query = supabase.from('sales').select('*');
        if (phone) {
            query = query.or(`customer_phone.eq.${phone},customer_name.eq.${name}`);
        } else {
            query = query.eq('customer_name', name);
        }
        return await query;
    },

    // ২. সেলস আইডিগুলোর আন্ডারে আইটেমগুলো আনা
    async getSaleItemsBySaleIds(saleIds) {
        return await supabase
            .from('sale_items')
            .select(`
                sale_id, quantity, price_per_unit, total_price,
                products ( name )
            `)
            .in('sale_id', saleIds);
    },

    // ৩. কাস্টমারের পেমেন্ট ডাটা আনা
    async getCustomerPayments(customerId) {
        return await supabase
            .from('customer_payments')
            .select('*')
            .eq('customer_id', customerId);
    },
    // সব কাস্টমারের মোট বকেয়া বের করা
    async getMarketDueSummary() {
        return await supabase.from('customers').select('total_due');
    },

    // কাস্টমার লিস্ট আনা (পেজিনেশন ও সার্চ সহ)
    async getCustomers(searchQuery, from, to) {
        let query = supabase.from('customers').select('*');
        
        if (searchQuery && searchQuery.trim() !== '') {
            query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
        } else {
            query = query.order('created_at', { ascending: false }).range(from, to);
        }
        return await query;
    }
};

module.exports = { CustomerRepository };