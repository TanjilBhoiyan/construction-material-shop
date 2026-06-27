const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// সিকিউরিটি চেক: যদি কি-গুলো না পায়, তবে অ্যাপ যেন এরর না দেয়
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ পরিবেশ ভ্যারিয়েবল (Environment variables) খুঁজে পাওয়া যায়নি!");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkConnection() {
    const dbStatus = document.getElementById('db-status');
    if (!dbStatus) return; // আইডি না থাকলে ফাংশন থেকে বের হয়ে যাও

    try {
        // কানেকশন চেক করার সময় একটি লোডিং স্টেট দেখাতে পারেন
        dbStatus.innerText = "● Connecting...";
        
        let { error } = await supabase.from('products').select('id').limit(1);
        if (error) throw error;

        dbStatus.innerText = "● Cloud DB Connected";
        dbStatus.className = "text-sm bg-green-500 text-white px-3 py-1 rounded-full font-semibold";
    } catch (err) {
        console.error("DB Connection Error:", err.message);
        dbStatus.innerText = "● Connection Failed!";
        dbStatus.className = "text-sm bg-red-500 text-white px-3 py-1 rounded-full font-semibold";
    }
}

// এই ফাংশনটি অ্যাপ লোড হওয়ার সময় কল করে দিবেন
module.exports = { supabase, checkConnection };