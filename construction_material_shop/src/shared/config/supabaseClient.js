// src/config/supabaseClient.js
require('dotenv').config(); // .env ফাইল থেকে গোপন ডাটা লোড করার জন্য
const { createClient } = require('@supabase/supabase-js');

// 🛠️ Supabase Credentials (.env ফাইল থেকে সরাসরি নিচ্ছে)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testDbConnection() {
    try {
        let { data, error } = await supabase.from('products').select('id').limit(1);
        if (error) throw error;
        return true; 
    } catch (err) {
        console.error("DB Connection Error:", err.message);
        return false; 
    }
}

module.exports = { supabase, testDbConnection };