// billing.repository.js
const { supabase } = require('../../config/supabaseClient');

const BillingRepository = {
    async getLaborSettings() {
        return await supabase.from('labor_settings').select('*');
    }
};

module.exports = { BillingRepository };