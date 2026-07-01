const { SettingsRepository } = require('./settings.repository');

async function loadLaborSettings() {
    try {
        const container = document.getElementById('labor-rates-container');
        if (!container) return;

        const { data: settings, error } = await SettingsRepository.getLaborSettings();
        if (error) throw error;

        if (!settings || settings.length === 0) {
            container.innerHTML = `<div class="col-span-2 text-center py-4 text-amber-600 font-medium">⚠️ কোনো সেটিংস পাওয়া যায়নি!</div>`;
            return;
        }

        container.innerHTML = '';
        settings.forEach(s => {
            const card = document.createElement('div');
            card.className = "bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-4";
            
            let unitText = `প্রতি ${s.category_key}`;
            card.innerHTML = `
                <div class="text-base font-bold text-gray-800 border-b pb-2">${s.category_name_bn || s.category_key}</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-500 mb-1">🛒 লোডিং রেট:</label>
                        <input type="text" data-key="${s.category_key}" data-type="loading" value="${s.rate_per_unit || 0}" class="labor-loading-input w-full p-2 border rounded">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-blue-600 mb-1">🚛 আনলোডিং রেট:</label>
                        <input type="text" data-key="${s.category_key}" data-type="unloading" value="${s.unloading_rate_per_unit || 0}" class="labor-unloading-input w-full p-2 border rounded">
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("সেটিংস লোড এরর:", err.message);
    }
}

function setupSettingsEvents() {
    const btnSave = document.getElementById('btn-save-labor-settings');
    if (!btnSave) return;

    btnSave.onclick = async function(e) {
        e.preventDefault();
        const loadingInputs = document.querySelectorAll('.labor-loading-input');
        const unloadingInputs = document.querySelectorAll('.labor-unloading-input');
        
        try {
            btnSave.innerText = "⏳ আপডেট হচ্ছে...";
            btnSave.disabled = true;

            const updateMap = {};
            loadingInputs.forEach(i => {
                const key = i.getAttribute('data-key');
                if(!updateMap[key]) updateMap[key] = {};
                updateMap[key].rate_per_unit = parseFloat(i.value) || 0;
            });
            unloadingInputs.forEach(i => {
                const key = i.getAttribute('data-key');
                if(!updateMap[key]) updateMap[key] = {};
                updateMap[key].unloading_rate_per_unit = parseFloat(i.value) || 0;
            });

            for (let key in updateMap) {
                const { error } = await SettingsRepository.updateLaborSetting(key, {
                    rate_per_unit: updateMap[key].rate_per_unit,
                    unloading_rate_per_unit: updateMap[key].unloading_rate_per_unit,
                    updated_at: new Date().toISOString()
                });
                if (error) throw error;
            }
            triggerLocalToast("🎉 সফলভাবে আপডেট হয়েছে!", false);
        } catch (err) {
            triggerLocalToast("❌ সমস্যা হয়েছে: " + err.message, true);
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