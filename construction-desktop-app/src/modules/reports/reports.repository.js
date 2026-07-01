// reports.repository.js
const { supabase } = require('../../config/supabaseClient');

const ReportsRepository = {
    async getSalesByDate(startIso, endIso) {
        return await supabase
            .from('sales')
            .select('*')
            .gte('created_at', startIso)
            .lte('created_at', endIso)
            .order('created_at', { ascending: false });
    },
    async getInventoryLogsByDate(startIso, endIso) {
        return await supabase
            .from('inventory_logs')
            .select('*')
            .gte('created_at', startIso)
            .lte('created_at', endIso)
            .order('created_at', { ascending: false });
    }
};

module.exports = { ReportsRepository };