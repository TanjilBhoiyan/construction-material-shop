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
    }
};

module.exports = { CustomerRepository };