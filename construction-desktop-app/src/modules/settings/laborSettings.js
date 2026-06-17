const { supabase } = require('../../config/supabaseClient');

// 🔄 ১. ডাটাবেজ থেকে সব লেবার রেট এনে ডাইনামিকালি কার্ড/ইনপুট বক্স জেনারেট করা
async function loadLaborSettings() {
    try {
        const container = document.getElementById('labor-rates-container');
        if (!container) return;

        // সুপাবেজ থেকে সব লেবার সেটিংস তুলে আনা (নতুন কলাম সহ)
        const { data: settings, error } = await supabase.from('labor_settings').select('*').order('category_key', { ascending: true });
        if (error) throw error;

        if (!settings || settings.length === 0) {
            container.innerHTML = `<div class="col-span-2 text-center py-4 text-amber-600 font-medium">⚠️ ডাটাবেজে কোনো লেবার সেটিংস পাওয়া যায়নি!</div>`;
            return;
        }

        container.innerHTML = ''; // লোডিং টেক্সট ক্লিয়ার করা

        // লুপ চালিয়ে প্রতিটা ইউনিটের জন্য ডাইনামিক HTML কার্ড তৈরি (ভিতরে ২টি করে ইনপুট থাকবে)
        settings.forEach(s => {
            const card = document.createElement('div');
            card.className = "bg-gray-50 p-5 rounded-lg border border-gray-200 animate-fade-in shadow-sm flex flex-col gap-4";
            
            let icon = "📦";
            let unitText = `প্রতি ${s.category_key}`;
            
            // ইউনিটের নাম অনুযায়ী আইকন চেঞ্জ করার জন্য
            if (s.category_key.includes('ব্যাগ') || s.category_key.toLowerCase().includes('bag')) icon = "📦";
            if (s.category_key.includes('কেজি') || s.category_key.toLowerCase().includes('kg')) icon = "🏗️";
            if (s.category_key.includes('বান্ডিল') || s.category_key.toLowerCase().includes('bundle')) icon = "🪵";

            card.innerHTML = `
                <!-- কার্ড হেডার (ক্যাটাগরির নাম) -->
                <div class="text-base font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                    ${icon} ${s.category_name_bn || s.category_key}
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- ইনপুট ১: লোডিং বা বিক্রয় লেবার রেট -->
                    <div>
                        <label class="block text-xs font-semibold text-gray-500 mb-1">🛒 লোডিং / বিক্রয় রেট:</label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold text-sm">৳</span>
                            <input type="text" 
                                inputmode="decimal"
                                data-key="${s.category_key}" 
                                data-type="loading"
                                value="${s.rate_per_unit || 0}" 
                                oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*?)\\..*/g, '$1');"
                                class="labor-loading-input w-full pl-7 pr-12 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 text-base">
                            <span class="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 text-[10px] font-medium bg-gray-100 border-l px-1.5 rounded-r-md">${unitText}</span>
                        </div>
                    </div>

                    <!-- ইনপুট ২: নতুন আনলোডিং লেবার রেট (Great Move 🎯) -->
                    <div>
                        <label class="block text-xs font-semibold text-blue-600 mb-1">🚛 আনলোডিং / ক্রয় রেট:</label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-blue-400 font-bold text-sm">৳</span>
                            <input type="text" 
                                inputmode="decimal"
                                data-key="${s.category_key}" 
                                data-type="unloading"
                                value="${s.unloading_rate_per_unit || 0}" 
                                oninput="this.value = this.value.replace(/[^0-9.]/g, '').replace(/(\\..*?)\\..*/g, '$1');"
                                class="labor-unloading-input w-full pl-7 pr-12 py-1.5 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700 text-base bg-blue-50/30">
                            <span class="absolute inset-y-0 right-0 pr-2 flex items-center text-blue-400 text-[10px] font-medium bg-blue-100/70 border-l border-blue-200 px-1.5 rounded-r-md">${unitText}</span>
                        </div>
                    </div>
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
        
        const loadingInputs = document.querySelectorAll('.labor-loading-input');
        const unloadingInputs = document.querySelectorAll('.labor-unloading-input');
        if (loadingInputs.length === 0) return;

        try {
            btnSave.innerText = "⏳ আপডেট হচ্ছে...";
            btnSave.disabled = true;

            // ডাটাবেজ আপডেটের অবজেক্ট তৈরি করার জন্য একটি ম্যাপ ব্যবহার করি
            const updatePayloads = {};

            // ১. লোডিং ইনপুট রিড করা
            loadingInputs.forEach(input => {
                const key = input.getAttribute('data-key');
                const rate = parseFloat(input.value) || 0;
                if (!updatePayloads[key]) updatePayloads[key] = {};
                updatePayloads[key].rate_per_unit = rate;
            });

            // ২. আনলোডিং ইনপুট রিড করা
            unloadingInputs.forEach(input => {
                const key = input.getAttribute('data-key');
                const rate = parseFloat(input.value) || 0;
                if (!updatePayloads[key]) updatePayloads[key] = {};
                updatePayloads[key].unloading_rate_per_unit = rate;
            });

            // ৩. লুপ চালিয়ে একবারে প্রতিটা ক্যাটাগরির দুটি রেটই সুপাবেজে আপডেট করা
            for (let key in updatePayloads) {
                const { error } = await supabase
                    .from('labor_settings')
                    .update({ 
                        rate_per_unit: updatePayloads[key].rate_per_unit, 
                        unloading_rate_per_unit: updatePayloads[key].unloading_rate_per_unit, // নতুন কলাম সিঙ্ক
                        updated_at: new Date().toISOString() 
                    })
                    .eq('category_key', key);

                if (error) throw error;
            }

            // ইন-অ্যাপ সুন্দর নোটিফিকেশন ফায়ার করা
            triggerLocalToast("🎉 সব লোডিং ও আনলোডিং রেট সফলভাবে আপডেট হয়েছে!", false);

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
    if (typeof window.showToast === 'function') {
        window.showToast(message, isError);
        return;
    }

    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none";
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `px-5 py-3 rounded-lg shadow-lg text-white font-bold text-sm transform transition-all duration-300 translate-y-2 opacity-0 flex items-center gap-2 ${
        isError ? 'bg-red-600' : 'bg-emerald-600'
    }`;
    toast.innerText = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

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