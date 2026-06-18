const { supabase } = require('../../config/supabaseClient');

async function getDailySalesData(targetDate = null) {
    try {
        let startIso, endIso;

        if (targetDate) {
            const localStart = new Date(`${targetDate}T00:00:00`);
            const localEnd = new Date(`${targetDate}T23:59:59.999`);
            startIso = localStart.toISOString();
            endIso = localEnd.toISOString();
        } else {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            startIso = startOfDay.toISOString();
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            endIso = endOfDay.toISOString();
        }

        let { data: sales, error } = await supabase
            .from('sales')
            .select('*') 
            .gte('created_at', startIso)
            .lte('created_at', endIso)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return sales || [];
    } catch (err) {
        console.error("Supabase থেকে সেলস ডাটা আনতে সমস্যা:", err.message);
        return [];
    }
}

// 📦 🆕 নতুন ফাংশন: Products টেবিল থেকে আনলোডিং ডাটা আনার জন্য
async function getDailyInventoryData(targetDate = null) {
    
    try {
        let startIso, endIso;

        if (targetDate) {
            const localStart = new Date(`${targetDate}T00:00:00`);
            const localEnd = new Date(`${targetDate}T23:59:59.999`);
            startIso = localStart.toISOString();
            endIso = localEnd.toISOString();
        } else {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            startIso = startOfDay.toISOString();
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            endIso = endOfDay.toISOString();
        }

        // 🚨 এই লাইনটি পরিবর্তন করুন: 'products' এর বদলে 'inventory_logs' দিন
        let { data: logs, error } = await supabase
            .from('inventory_logs') 
            .select('*') 
            .gte('created_at', startIso)
            .lte('created_at', endIso)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return logs || []; // এখন ডাটাগুলো logs হিসেবে আসবে
    } catch (err) {
        console.error("Supabase থেকে ইনভেন্টরি লগ আনতে সমস্যা:", err.message);
        return [];
    }
}

module.exports = { getDailySalesData, getDailyInventoryData };