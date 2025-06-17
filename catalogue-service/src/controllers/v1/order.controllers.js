const { default: mongoose } = require("mongoose");
const { error, success, getTotalMenuGST, success_with_page } = require("../../functions/functions")
const { MenusModal } = require("../../schemas/menu");
const { BillOrderModal } = require("../../schemas/bill-order");
const moment = require("moment");
const axios = require("axios")
const addBill = async (_req, _res) => {
    const { sell_by, note, payment_mode, items, customer, payment_type, bill_no } = _req.body || {}
    let vendor = _req.headers["parent"]
    vendor = new mongoose.Types.ObjectId(vendor);
    let menus = await MenusModal.find({
        _id: {
            $in: items.map((it) => it.menu_id)
        },
        vendor
    }).lean();
    const mappedMenus = menus.map(menu => {
        const found = items.find(i => i.menu_id == String(menu._id));
        return {
            ...menu,
            selected_qty: found?.selected_qty || 0
        };
    });
    const { totalSGST, totalCGST, totalDiscount, totalPrice } = getTotalMenuGST(mappedMenus)
    const bill_status = payment_type == "save" ? "PAID" : "UNPAID"
    const payment_status = payment_type == "save" ? true : false
    const new_payment_mode = payment_type == "save" ? payment_mode : "No Payment"
    const orderCreate = new BillOrderModal({
        payment_mode: new_payment_mode,
        sell_by,
        note,
        total_amount: totalPrice,
        total_discount: totalDiscount,
        total_cgst: totalCGST,
        total_sgst: totalSGST,
        total_items: items.length,
        bill_no: bill_no,
        vendor,
        user: vendor,
        // customer: customer,
        bill_status: bill_status,
        payment_status,
        items: mappedMenus.map((it) => {
            return {
                menu_id: it._id,
                selected_qty: it.selected_qty,
                price: it.price,
                discount: it.discount,
                type: it.type,
                gst_percentage: it.gst_percentage,
                total_price_with_gst: it.total_price_with_gst,
                name: it.name,
            }
        }),
        deleted: false,
        tax_type: "EXCLUSIVE"
    })

    await orderCreate.save()

    return _res.json(success({ orderCreate }))
}
const updateBill = async (_req, _res) => {
    try {
        const { sell_by, note, payment_mode, items, customer, payment_type, bill_no, order_id } = _req.body || {};
        let vendor = _req.headers["parent"];
        let updatedBy = _req.headers["user"];

        if (!order_id) return _res.status(400).json(error("Missing Order Id"));

        vendor = new mongoose.Types.ObjectId(vendor);

        // Fetch menu details
        const menus = await MenusModal.find({
            _id: { $in: items.map((it) => it.menu_id) },
            vendor
        }).lean();

        // Attach selected qty
        const mappedMenus = menus.map(menu => {
            const found = items.find(i => i.menu_id == String(menu._id));
            return {
                ...menu,
                selected_qty: found?.selected_qty || 0
            };
        });

        // GST & totals
        const { totalSGST, totalCGST, totalDiscount, totalPrice } = getTotalMenuGST(mappedMenus);
        const bill_status = payment_type === "save" ? "PAID" : "UNPAID";
        const payment_status = payment_type === "save";

        // Update query
        const updatedBill = await BillOrderModal.findOneAndUpdate(
            { order_id },
            {
                payment_mode,
                sell_by,
                note,
                total_amount: totalPrice,
                total_discount: totalDiscount,
                total_cgst: totalCGST,
                total_sgst: totalSGST,
                total_items: items.length,
                bill_no,
                vendor,
                user: vendor,
                updatedBy,
                // customer,
                bill_status,
                payment_status,
                items: mappedMenus.map((it) => ({
                    menu_id: it._id,
                    selected_qty: it.selected_qty,
                    price: it.price,
                    discount: it.discount,
                    type: it.type,
                    gst_percentage: it.gst_percentage,
                    total_price_with_gst: it.total_price_with_gst,
                    name: it.name,
                })),
                tax_type: "EXCLUSIVE",
                deleted: false
            },
            { new: true }
        );

        return _res.json(success({ updatedBill }));
    } catch (err) {
        console.error("Update Bill Error:", err);
        return _res.status(500).json(error("Failed to update bill"));
    }
};

const getOrderList = async (_req, _res) => {
    let vendor = _req.headers["parent"]
    vendor = new mongoose.Types.ObjectId(vendor);
    const page = parseInt(_req.query.page) + 1 || 1;
    const limit = parseInt(_req.query.page_size) || 15;
    const skip = (page - 1) * limit;
    const search = _req.query.search || "";
    const result = await BillOrderModal.aggregate([
        {
            $match: {
                vendor,
                $or: [
                    { order_id: { $regex: search, $options: "i" } },
                    { total_amount: { $regex: search, $options: "i" } },
                ]

            }
        },
        {
            $facet: {
                data: [
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ]);
    let orders = result[0].data;
    const cache = new Map();

    orders = await Promise.all(orders.map(async (item) => {
        let user = null;
        let updatedBy = null;

        // Handle user
        if (item.user) {
            if (cache.has(item.user)) {
                user = cache.get(item.user);
            } else {
                const response = await axios.get(`${process.env.CUSTOMER_SERVICE_URL}/no-auth/verify/${item.user}`);
                user = response.data._payload.existUser;
                cache.set(item.user, user);
            }
        }

        // Handle updatedBy
        if (item.updatedBy) {
            if (cache.has(item.updatedBy)) {
                updatedBy = cache.get(item.updatedBy);
            } else {
                const response = await axios.get(`${process.env.CUSTOMER_SERVICE_URL}/no-auth/verify/${item.updatedBy}`);
                updatedBy = response.data._payload.existUser;
                cache.set(item.updatedBy, updatedBy);
            }
        }

        return {
            ...item,
            user,
            updatedBy
        };
    }));
    const total = result[0].totalCount[0]?.count || 0;

    return _res.json(success_with_page(
        orders,
        total,
        page,
        limit,
        Math.ceil(total / limit)
    ))
}
const getNextBillNo = async (_req, _res) => {
    try {
        let vendorId = _req.headers["parent"];

        if (!vendorId) {
            return _res.status(400).json(error("Vendor ID is required in headers."));
        }

        const vendor = new mongoose.Types.ObjectId(vendorId);

        // Get today's date range
        const startOfDay = moment().startOf('day').toDate();
        const endOfDay = moment().endOf('day').toDate();

        // Find latest bill_no for this vendor today
        const latestBill = await BillOrderModal.findOne({
            vendor,
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ bill_no: -1 }).lean();

        const nextBillNo = latestBill ? latestBill.bill_no + 1 : 1;

        return _res.json(success({ bill_no: nextBillNo }));
    } catch (err) {
        console.error("Error in getNextBillNo:", err);
        return _res.status(500).json(error("Failed to generate bill number."));
    }
};
const getOrderInfoByOrderId = async (_req, _res) => {
    try {
        let vendorId = _req.headers["parent"];
        let { order_id } = _req.params
        if (!vendorId) {
            return _res.status(400).json(error("Vendor ID is required in headers."));
        }
        const vendor = new mongoose.Types.ObjectId(vendorId);

        const order = await BillOrderModal.findOne({
            vendor,
            order_id
        }).lean();
        return _res.json(success({ ...order }));
    } catch (err) {
        console.error("Failed to fetch order details:", err);
        return _res.status(500).json(error("Failed to fetch order details."));
    }
};

module.exports = { addBill, getNextBillNo, getOrderList, getOrderInfoByOrderId, updateBill }