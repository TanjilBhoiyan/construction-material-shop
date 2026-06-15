// modules/settings/laborSettings.js
const { supabase } = require('../../config/supabaseClient');

// Toast Helper
function showToast(message, isError = false) {
    const oldToast = document.getElementById('app-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.innerText = message;

    toast.className = `fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 ${
        isError ? 'bg-red-600' : 'bg-green-600'
    }`;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 🔄 ১. ডাটাবেজ থেকে লেবার রেট এনে ইনপুট বক্সে বসানো
async function loadLaborSettings() {
    try {
        const inputCement = document.getElementById('setting-cement-rate');
        const inputRod = document.getElementById('setting-rod-rate');

        if (!inputCement || !inputRod) return;

        const { data: settings, error } = await supabase
            .from('labor_settings')
            .select('*');

        if (error) throw error;

        if (settings) {
            settings.forEach(s => {
                if (s.category_key === 'cement')
                    inputCement.value = s.rate_per_unit;

                if (s.category_key === 'rod')
                    inputRod.value = s.rate_per_unit;
            });
        }
    } catch (err) {
        console.error("লেবার সেটিংস লোড করতে সমস্যা:", err.message);
        showToast("লেবার সেটিংস লোড করতে সমস্যা হয়েছে", true);
    }
}

// 💾 ২. "রেট সেটিংস আপডেট করুন" বাটনের ইভেন্ট হ্যান্ডলার
function setupSettingsEvents() {
    const btnSave = document.getElementById('btn-save-labor-settings');
    if (!btnSave) return;

    btnSave.onclick = async function(e) {
        e.preventDefault();

        const cementRate =
            parseFloat(document.getElementById('setting-cement-rate').value) || 0;

        const rodRate =
            parseFloat(document.getElementById('setting-rod-rate').value) || 0;

        try {
            btnSave.innerText = "⏳ আপডেট হচ্ছে...";
            btnSave.disabled = true;

            const { error: cementErr } = await supabase
                .from('labor_settings')
                .update({ rate_per_unit: cementRate })
                .eq('category_key', 'cement');

            const { error: rodErr } = await supabase
                .from('labor_settings')
                .update({ rate_per_unit: rodRate })
                .eq('category_key', 'rod');

            if (cementErr) throw cementErr;
            if (rodErr) throw rodErr;

            showToast("🎉 লেবার রেট সফলভাবে আপডেট হয়েছে!");

            // Electron focus restore
            setTimeout(() => {
                window.focus();
                document.getElementById('setting-cement-rate')?.focus();
            }, 50);

        } catch (err) {
            console.error("সেটিংস সেভ এরর:", err.message);

            showToast(
                "সংরক্ষণ করতে সমস্যা হয়েছে: " + err.message,
                true
            );
        } finally {
            btnSave.innerText = "💾 রেট সেটিংস আপডেট করুন";
            btnSave.disabled = false;
        }
    };
}

function initLaborSettingsModule() {
    loadLaborSettings();
    setupSettingsEvents();
}

module.exports = { initLaborSettingsModule };