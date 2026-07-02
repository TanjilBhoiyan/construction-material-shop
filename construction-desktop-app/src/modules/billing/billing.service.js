// billing.service.js
const { BillingRepository } = require('./billing.repository');

const BillingService = {
    // কার্ট এবং কস্ট ডাটা থেকে বিল সামারি ক্যালকুলেট করা
    calculateBillSummary(cart, laborData, transportData, cashPaid) {
        const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);

        let totalPayable = subtotal;

        // বিজনেস লজিক: কাস্টমার খরচ বহন করলে তা যোগ হবে
        if (laborData.bearer === 'customer') {
            totalPayable += laborData.cost;
        }
        if (transportData.bearer === 'customer') {
            totalPayable += transportData.cost;
        }

        const due = totalPayable - cashPaid;

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            totalPayable: parseFloat(totalPayable.toFixed(2)),
            due: parseFloat(due.toFixed(2))
        };
    },

    // নতুন ফাংশন: লেবার খরচ ক্যালকুলেট করা
    async calculateLaborCost(cart, settings) {
        const rateMap = {};
        settings.forEach(s => {
            rateMap[s.category_key.trim().toLowerCase()] = parseFloat(s.rate_per_unit) || 0;
        });

        let totalLaborCost = 0;
        cart.forEach(item => {
            const qty = parseFloat(item.quantity) || 0;
            const rawUnit = (item.unit || '').trim().toLowerCase();
            let targetKey = 'others';

            if (rawUnit.includes('ব্যাগ') || rawUnit.includes('bag') || rawUnit.includes('bosta')) targetKey = 'bag';
            else if (rawUnit.includes('কেজি') || rawUnit.includes('kg')) targetKey = 'kg';
            else if (rawUnit.includes('বান্ডিল') || rawUnit.includes('bundle')) targetKey = 'bundle';
            else if (rawUnit.includes('পিস') || rawUnit.includes('pcs')) targetKey = 'pcs';

            totalLaborCost += qty * (rateMap[targetKey] !== undefined ? rateMap[targetKey] : (rateMap['others'] || 0));
        });
        return totalLaborCost;
    },

    // নতুন ফাংশন: সেল প্রসেস ও ডাটাবেজ আপডেট
    async finalizeSale(saleData, cart, customerData) {
        // ১. স্টক আপডেট
        for (const item of cart) {
            const { data: currentProd, error: fetchErr } = await BillingRepository.getProductStock(item.product_id);
            if (fetchErr) throw fetchErr;
            if (currentProd.current_stock < item.quantity) {
                throw new Error(`${item.name}-এর পর্যাপ্ত স্টক নেই!`);
            }
            await BillingRepository.updateProductStock(item.product_id, currentProd.current_stock - item.quantity);
        }

        // ২. কাস্টমার লেজার সিঙ্ক
        if (customerData.name && customerData.name !== "অনিবন্ধিত কাস্টমার") {
            const { data: existingCustomer } = await BillingRepository.getCustomer(customerData.phone, customerData.name);
            if (existingCustomer) {
                await BillingRepository.updateCustomer(existingCustomer.id, {
                    total_due: existingCustomer.total_due + saleData.due_amount,
                    father_name: customerData.father_name || existingCustomer.father_name,
                    customer_address: customerData.customer_address || existingCustomer.customer_address
                });
            } else {
                await BillingRepository.insertCustomer({
                    name: customerData.name,
                    phone: customerData.phone,
                    father_name: customerData.father_name,
                    customer_address: customerData.customer_address,
                    total_due: saleData.due_amount
                });
            }
        }

        // ৩. সেলস সেভ করা
        const { data: savedSale, error: saleErr } = await BillingRepository.saveSale(saleData);
        if (saleErr) throw saleErr;

        // ৪. সেল আইটেম সেভ করা
        const itemsToInsert = cart.map(item => ({
            sale_id: savedSale[0].id,
            product_id: item.product_id,
            quantity: parseFloat(item.quantity) || 0,
            price_per_unit: parseFloat(item.price_per_unit) || 0,
            total_price: parseFloat(item.total_price) || 0
        }));
        await BillingRepository.saveSaleItems(itemsToInsert);

        return savedSale;
    }
};

module.exports = { BillingService };