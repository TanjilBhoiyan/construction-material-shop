const { supabase } = require('../../config/supabaseClient');

async function getDailySalesData(targetDate = null) {
    try {
        let startIso, endIso;

        if (targetDate) {
            // targetDate এর ফরম্যাট থাকে 'YYYY-MM-DD'
            // বাংলাদেশ সময় (+06:00) অনুযায়ী দিনের শুরু ও শেষকে UTC-তে কনভার্ট করার নিয়ম:
            // লোকাল 00:00:00 মানে UTC-তে আগের দিনের 18:00:00 (যেহেতু ৬ ঘণ্টা এগিয়ে)
            // লোকাল 23:59:59.999 মানে UTC-তে সেই দিনের 17:59:59.999
            
            const localStart = new Date(`${targetDate}T00:00:00`);
            const localEnd = new Date(`${targetDate}T23:59:59.999`);
            
            // .toISOString() অটোমেটিক লোকাল টাইমকে ডাটাবেজের UTC টাইমে কনভার্ট করে দেয়
            startIso = localStart.toISOString();
            endIso = localEnd.toISOString();
        } else {
            // ডিফল্ট স্টেট: আজকের দিনের লোকাল টাইমিং (বাংলাদেশ সময় অনুযায়ী নিখুঁত ২৪ ঘণ্টা)
            const now = new Date();
            
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            startIso = startOfDay.toISOString();

            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            endIso = endOfDay.toISOString();
        }

        // ডাটাবেজ কুয়েরি
        let { data: sales, error } = await supabase
            .from('sales')
            .select('created_at, customer_name, customer_phone, father_name, customer_address, total_payable, cash_paid, due_amount, subtotal')
            .gte('created_at', startIso)
            .lte('created_at', endIso)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return sales || [];
    } catch (err) {
        console.error("Supabase থেকে রিপোর্টের ডাটা আনতে সমস্যা হয়েছে:", err.message);
        return [];
    }
}

module.exports = { getDailySalesData };