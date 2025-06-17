
function success(data, message) {
    return {
        _payload: data,
        type: "success",
        message
    };
}
function success_with_page(data, total_records, page, limit, totalPages, message) {
    return {
        _payload: data,
        type: "success",
        message,
        page,
        totalPages,
        limit,
        total_records

    };
}

function error(statusCode, message, errors = []) {
    return {
        _payload_error: errors,
        message,
        statusCode,
        type: "error"
    };
}
function info(message, data = null) {
    return {
        _payload_error: data,
        message,
        type: "info"
    };
}
const handleConverter = (name) => {
    if (typeof name != "string") {
        throw new Error("Name should be string.")
    }
    const convert = name.toLowerCase().split(" ").join("-")
    return convert
}


function getTotalMenuGST(menuList) {
    let totalSGST = 0;
    let totalCGST = 0;
    let totalDiscount = 0;
    let totalPrice = 0;

    menuList.forEach(menu => {
        if (!menu.status) return;

        const qty = menu.selected_qty || 1;
        const gstPercentage = menu.gst_percentage || 0;
        const discount = menu.discount || 0;
        const gstInclusivePrice = menu.total_price_with_gst || menu.price;

        const totalMenuPrice = gstInclusivePrice * qty;
        const discountTotal = discount * qty;

        // Base price (without GST)
        const basePrice = (totalMenuPrice * 100) / (100 + gstPercentage);
        const totalGST = totalMenuPrice - basePrice;

        const cgst = totalGST / 2;
        const sgst = totalGST / 2;

        totalSGST += sgst;
        totalCGST += cgst;
        totalDiscount += discountTotal;
        totalPrice += totalMenuPrice;

        // If you later want to add addon GST, compute similarly from `addon.total_price_with_gst`
    });

    return {
        totalSGST: parseFloat(totalSGST.toFixed(2)),
        totalCGST: parseFloat(totalCGST.toFixed(2)),
        totalGST: parseFloat((totalSGST + totalCGST).toFixed(2)),
        totalDiscount: parseFloat(totalDiscount.toFixed(2)),
        totalPrice: parseFloat(totalPrice.toFixed(2)),
    };
}
module.exports = { info, error, success, handleConverter, success_with_page, getTotalMenuGST }