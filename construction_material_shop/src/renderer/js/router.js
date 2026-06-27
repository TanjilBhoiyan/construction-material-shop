const fs = require('fs');
const path = require('path');
const { InventoryUI } = require('./modules/inventory.ui');
const { CustomerUI } = require('./modules/customer.ui.js');
const { BillingUI } = require('./modules/billing.ui.js');
const { ReportUI } = require('./modules/reports.ui.js');
const Router = {
    loadScreen(screenName) {
        const container = document.getElementById('app-container');

        if (!container) {
            console.error('app-container not found');
            return;
        }

        try {
            // src/renderer/pages/*.html
            const htmlPath = path.join(
                __dirname,
                '../pages',
                `${screenName}.html`
            );

            console.log('Loading screen:', htmlPath);

            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            container.innerHTML = htmlContent;

            // সব বাটনের স্টাইল রিসেট
            this.resetButtonStyles();

            // নির্দিষ্ট স্ক্রিনের লজিক
            switch (screenName) {
                case 'inventory':
                    this.setActiveButton('tab-inventory-btn');

                    if (InventoryUI && typeof InventoryUI.render === 'function') {
                        InventoryUI.render(container);
                    }
                    break;

                case 'billing':
                    document.getElementById('tab-billing-btn').className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white";
                    // HTML লোড হওয়ার পর
                    BillingUI.render(container);
                    break;

                case 'report':
                    document.getElementById('tab-report-btn').className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white";
                    ReportUI.render(container); // মডিউল কল করুন
                    break;

                case 'customer':
                    document.getElementById('tab-customer-btn').className = "bg-blue-700 px-4 py-2 rounded font-semibold text-white";
                    // আগে HTML লোড হবে, তারপর UI মডিউলটি রেন্ডার হবে
                    CustomerUI.render(container);
                    break;
                case 'settings':
                    this.setActiveButton('tab-settings-btn');
                    break;

                default:
                    console.warn(`Unknown screen: ${screenName}`);
            }
        } catch (err) {
            console.error('Error loading screen:', err);

            container.innerHTML = `
                <div style="color:red;padding:20px;">
                    Error: ${screenName}.html ফাইলটি পাওয়া যায়নি।
                </div>
            `;
        }
    },

    resetButtonStyles() {
        const buttons = [
            'tab-inventory-btn',
            'tab-billing-btn',
            'tab-report-btn',
            'tab-customer-btn',
            'tab-settings-btn'
        ];

        buttons.forEach(id => {
            const btn = document.getElementById(id);

            if (btn) {
                btn.className =
                    'hover:bg-blue-500 px-4 py-2 rounded font-semibold text-gray-200';
            }
        });
    },

    setActiveButton(buttonId) {
        const btn = document.getElementById(buttonId);

        if (btn) {
            btn.className =
                'bg-blue-700 px-4 py-2 rounded font-semibold text-white';
        }
    },

    init() {
        document
            .getElementById('tab-inventory-btn')
            ?.addEventListener('click', () => this.loadScreen('inventory'));

        document
            .getElementById('tab-billing-btn')
            ?.addEventListener('click', () => this.loadScreen('billing'));

        document
            .getElementById('tab-report-btn')
            ?.addEventListener('click', () => this.loadScreen('report'));

        document
            .getElementById('tab-customer-btn')
            ?.addEventListener('click', () => this.loadScreen('customer'));

        document
            .getElementById('tab-settings-btn')
            ?.addEventListener('click', () => this.loadScreen('settings'));
    }
};

module.exports = Router;