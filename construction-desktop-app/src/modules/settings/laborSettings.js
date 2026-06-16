const { supabase } = require('../../config/supabaseClient');

// 🔄 ১. ডাটাবেজ থেকে সব লেবার রেট এনে ডাইনামিকালি কার্ড/ইনপুট বক্স জেনারেট করা
async function loadLaborSettings() {
    try {
        const container = document.getElementById('labor-rates-container');
        if (!container) return;

        // সুপাবেজ থেকে সব লেবার সেটিংস তুলে আনা
        const { data: settings, error } = await supabase.from('labor_settings').select('*').order('category_key', { ascending: true });
        if (error) throw error;

        if (!settings || settings.length === 0) {
            container.innerHTML = `<div class="col-span-2 text-center py-4 text-amber-600 font-medium">⚠️ ডাটাবেজে কোনো লেবার সেটিংস পাওয়া যায়নি!</div>`;
            return;
        }

        container.innerHTML = ''; // লোডিং টেক্সট ক্লিয়ার করা

        // লুপ চালিয়ে প্রতিটা ইউনিটের জন্য ডাইনামিক HTML কার্ড তৈরি
        settings.forEach(s => {
            const card = document.createElement('div');
            card.className = "bg-gray-50 p-4 rounded-lg border border-gray-100 animate-fade-in";
            
            let icon = "📦";
            let unitText = `প্রতি ${s.category_key}`;
            
            // ইউনিটের নাম অনুযায়ী আইকন চেঞ্জ করার জন্য
            if (s.category_key.includes('ব্যাগ') || s.category_key.toLowerCase().includes('bag')) icon = "📦";
            if (s.category_key.includes('কেজি') || s.category_key.toLowerCase().includes('kg')) icon = "🏗️";
            if (s.category_key.includes('বান্ডিল') || s.category_key.toLowerCase().includes('bundle')) icon = "🪵";

            card.innerHTML = `
                <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5 capitalize">
                    ${icon} ${s.category_name_bn || s.category_key} লেবার রেট:
                </label>
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold text-sm">৳</span>
                    
                    <input type="text" 
                        inputmode="decimal"
                        data-key="${s.category_key}" 
                        value="${s.rate_per_unit || 0}" 
                        oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*?)\\..*/g, '$1');"
                        class="labor-rate-input w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 text-lg">
                        
                    <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-xs font-medium bg-gray-200 border-l px-2 rounded-r-md">${unitText}</span>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error("লেবার সেটিংস লোড করতে সমস্যা:", err.message);
    }
}

// 💾 ২. "রেট সেটিংস আপডেট করুন" বাটনের ইভেন্ট হ্যান্ডলার
function setupSettingsEvents() {
    const btnSave = document.getElementById('btn-save-labor-settings');
    if (!btnSave) return;

    btnSave.onclick = async function(e) {
        e.preventDefault();
        
        const inputs = document.querySelectorAll('.labor-rate-input');
        if (inputs.length === 0) return;

        try {
            btnSave.innerText = "⏳ আপডেট হচ্ছে...";
            btnSave.disabled = true;

            // সব ডাইনামিক ইনপুট লুপ চালিয়ে ডাটাবেজে আপডেট করা
            for (let input of inputs) {
                const key = input.getAttribute('data-key');
                const rate = parseFloat(input.value) || 0;

                const { error } = await supabase
                    .from('labor_settings')
                    .update({ rate_per_unit: rate, updated_at: new Date().toISOString() })
                    .eq('category_key', key);

                if (error) throw error;
            }

            // ইন-অ্যাপ সুন্দর নোটিফিকেশন ফায়ার করা
            triggerLocalToast("🎉 সব লেবার রেট সফলভাবে আপডেট হয়েছে!", false);

        } catch (err) {
            console.error("সেটিংস সেভ এরর:", err.message);
            triggerLocalToast("❌ সংরক্ষণ করতে সমস্যা হয়েছে: " + err.message, true);
        } finally {
            btnSave.innerText = "💾 রেট সেটিংস আপডেট করুন";
            btnSave.disabled = false;
        }
    };
}

// 🎯 রানটাইমে প্রজেক্টের ভেতরে সুন্দর ইন-অ্যাপ টোস্ট দেখানোর ফিক্সড ফাংশন
function triggerLocalToast(message, isError) {
    // ১. গ্লোবাল উইন্ডো স্কোপে বা ইন্ডেক্সে সরাসরি ফাংশন থাকলে তা ব্যবহার করবে
    if (typeof window.showToast === 'function') {
        window.showToast(message, isError);
        return;
    }

    // ২. যদি আপনার অ্যাপে অলরেডি কোনো টোস্ট কন্টেইনার (div) স্ক্রিনে থেকে থাকে
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        // না থাকলে ডাইনামিকালি একটি ইন-অ্যাপ সুন্দর টোস্ট নোটিফিকেশন বক্স তৈরি করবে
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none";
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    // ভুল হলে লাল ব্যাকগ্রাউন্ড, সাকসেস হলে সুন্দর গাঢ় সবুজ ব্যাকগ্রাউন্ড
    toast.className = `px-5 py-3 rounded-lg shadow-lg text-white font-bold text-sm transform transition-all duration-300 translate-y-2 opacity-0 flex items-center gap-2 ${
        isError ? 'bg-red-600' : 'bg-emerald-600'
    }`;
    toast.innerText = message;

    toastContainer.appendChild(toast);

    // অ্যানিমেশন ইফেক্ট সহ স্ক্রিনে আনা
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    // ৪ সেকেন্ড পর স্ক্রিন থেকে সুন্দরভাবে ভ্যানিশ করে দেওয়া
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function initLaborSettingsModule() {
    loadLaborSettings();
    setupSettingsEvents();
}

module.exports = { initLaborSettingsModule };