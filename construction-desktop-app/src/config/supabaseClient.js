const { createClient } = require('@supabase/supabase-js');

// 🛠️ Supabase Credentials
const SUPABASE_URL = 'https://zbqrrfkhgfqfidwqrfxz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_datT1OkeZeRtYqgyVoU4bw_H7mk8w9q';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ডাটাবেজ কানেকশন চেক করার গ্লোবাল লজিক
async function checkConnection() {
    const dbStatus = document.getElementById('db-status');
    try {
        if (!dbStatus) return;
        
        let { data, error } = await supabase.from('products').select('id').limit(1);
        if (error) throw error;

        dbStatus.innerText = "● Cloud DB Connected";
        dbStatus.className = "text-sm bg-green-500 text-white px-3 py-1 rounded-full font-semibold animate-none";
    } catch (err) {
        console.error("DB Connection Error:", err.message);
        if (dbStatus) {
            dbStatus.innerText = "● Connection Failed!";
            dbStatus.className = "text-sm bg-red-500 text-white px-3 py-1 rounded-full font-semibold animate-none";
        }
    }
}

// অন্য ফাইল থেকে ব্যবহার করার জন্য এক্সপোর্ট করা হলো
module.exports = { supabase, checkConnection };