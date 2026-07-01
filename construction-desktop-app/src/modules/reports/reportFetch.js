// reportFetch.js
const { ReportsRepository } = require('./reports.repository');

// হেল্পার ফাংশন: তারিখ কনভার্ট করার জন্য
function getDateRange(targetDate) {
    let start, end;
    if (targetDate) {
        start = new Date(`${targetDate}T00:00:00`).toISOString();
        end = new Date(`${targetDate}T23:59:59.999`).toISOString();
    } else {
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    }
    return { start, end };
}

async function getDailySalesData(targetDate = null) {
    try {
        const { start, end } = getDateRange(targetDate);
        const { data: sales, error } = await ReportsRepository.getSalesByDate(start, end);
        if (error) throw error;
        return sales || [];
    } catch (err) {
        console.error("সেলস ডাটা আনতে সমস্যা:", err.message);
        return [];
    }
}

async function getDailyInventoryData(targetDate = null) {
    try {
        const { start, end } = getDateRange(targetDate);
        const { data: logs, error } = await ReportsRepository.getInventoryLogsByDate(start, end);
        if (error) throw error;
        return logs || [];
    } catch (err) {
        console.error("ইনভেন্টরি লগ আনতে সমস্যা:", err.message);
        return [];
    }
}

module.exports = { getDailySalesData, getDailyInventoryData };