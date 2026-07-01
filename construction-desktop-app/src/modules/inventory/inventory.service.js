const { InventoryRepository } = require('./inventory.repository');

const InventoryService = {
    // ফাংশনটি এখন অবজেক্টের ভেতরে আছে
    async getFormattedProducts() {
        const { data, error } = await InventoryRepository.getProducts();
        if (error) throw error;

        return (data || []).map(prod => ({
            ...prod,
            current_stock: prod.current_stock ?? 0,
            buying_price: parseFloat(prod.buying_price || 0),
            default_selling_price: parseFloat(prod.default_selling_price || 0),
            unit: prod.unit || ''
        }));
    },
    // আনলোডিং খরচ ক্যালকুলেশন লজিক
    async calculateUnloadingCost(stock, unit) {
        let dbCategoryKey = 'others';
        const rawUnitLower = unit.toLowerCase();
        if (rawUnitLower.includes('ব্যাগ') || rawUnitLower.includes('bag')) dbCategoryKey = 'bag';
        else if (rawUnitLower.includes('কেজি') || rawUnitLower.includes('kg')) dbCategoryKey = 'kg';
        else if (rawUnitLower.includes('বান্ডিল') || rawUnitLower.includes('bundle')) dbCategoryKey = 'bundle';
        else if (rawUnitLower.includes('পিস') || rawUnitLower.includes('pcs')) dbCategoryKey = 'pcs';

        const { data, error } = await InventoryRepository.getLaborRate(dbCategoryKey);
        if (error || !data) return 0;
        
        return (stock * parseFloat(data.unloading_rate_per_unit || 0)).toFixed(2);
    },

    // প্রোডাক্ট সাবমিট করার বিজনেজ লজিক
    async processProductSubmission(productData) {
        const { selectedId, name, unit, newStock, buyingPrice, sellingPrice, unloadingLaborCost, cachedProducts } = productData;

        if (selectedId) {
            const existingProd = (cachedProducts || []).find(p => p.id === parseInt(selectedId));
            const finalStock = parseFloat(existingProd?.current_stock || 0) + newStock;

            await InventoryRepository.updateProduct(selectedId, {
                current_stock: finalStock, buying_price: buyingPrice,
                default_selling_price: sellingPrice, unit, unloading_labor_cost: unloadingLaborCost
            });

            if (unloadingLaborCost > 0) {
                await InventoryRepository.insertLog({ product_id: parseInt(selectedId), product_name: name, labor_cost: unloadingLaborCost });
            }
        } else {
            const { data, error } = await InventoryRepository.insertProduct({
                name, unit, current_stock: newStock, buying_price: buyingPrice,
                default_selling_price: sellingPrice, unloading_labor_cost: unloadingLaborCost
            });
            if (error) throw error;

            if (unloadingLaborCost > 0) {
                await InventoryRepository.insertLog({ product_id: data[0].id, product_name: name, labor_cost: unloadingLaborCost });
            }
        }
    },

    

    
};

module.exports = { InventoryService };