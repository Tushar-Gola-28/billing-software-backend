const { default: mongoose } = require("mongoose")
const { success, handleConverter, success_with_page, error } = require("../../functions/functions")
const { MenusModal } = require("../../schemas/menu")
const axios = require("axios")
const addMenu = async (_req, _res) => {
    const { category_id, note, code, qty, price, name, discount, image, type, status, total_price_with_gst, gst_percentage } = _req.body || {}
    const vendor = _req.headers["parent"]
    const user = _req.headers["user"]
    // === Field Validations ===
    if (!vendor) return _res.status(400).json(error(400, "Missing 'vendor' in headers."))
    if (!user) return _res.status(400).json(error(400, "Missing 'user' in headers."))

    if (!name || typeof name !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'name'. It must be a non-empty string."))
    }

    if (!code || typeof code !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'code'. It must be a non-empty string."))
    }

    if (!category_id || typeof category_id !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'category_id'. It must be a string."))
    }

    if (price === undefined || typeof price !== "number" || price < 0) {
        return _res.status(400).json(error(400, "Invalid or missing 'price'. It must be a non-negative number."))
    }

    if (qty === undefined || typeof qty !== "number" || qty < 0) {
        return _res.status(400).json(error(400, "Invalid or missing 'qty'. It must be a non-negative number."))
    }

    if (discount !== undefined && (typeof discount !== "number" || discount < 0)) {
        return _res.status(400).json(error(400, "'discount' must be a non-negative number if provided."))
    }

    if (!type || typeof type !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'type'. It must be a string."))
    }

    if (!status || typeof status !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'status'. It must be a string."))
    }

    if (total_price_with_gst !== undefined && (typeof total_price_with_gst !== "number" || total_price_with_gst < 0)) {
        return _res.status(400).json(error(400, "'total_price_with_gst' must be a non-negative number if provided."))
    }

    if (gst_percentage !== undefined && (typeof gst_percentage !== "number" || gst_percentage < 0)) {
        return _res.status(400).json(error(400, "'gst_percentage' must be a non-negative number if provided."))
    }

    if (note !== undefined && typeof note !== "string") {
        return _res.status(400).json(error(400, "'note' must be a string if provided."))
    }
    const newCode = code.toLowerCase()
    const exist = await MenusModal.findOne({
        vendor,
        $or: [
            { name },
            { code: newCode }
        ]
    });

    if (exist) {
        return _res.status(400).json(error(400, `Menu Already exist! Please enter unique menu details.`))
    }
    const create = new MenusModal({ name, code: newCode, note, handle: handleConverter(name), vendor, category_id, price, qty, discount, image, type, status, total_price_with_gst, gst_percentage, user })
    await create.save()
    return _res.json(success(create))

}
const updateMenu = async (_req, _res) => {
    const { category_id, note, code, qty, price, name, discount, image, type, status, _id, total_price_with_gst, gst_percentage } = _req.body || {}
    const newCode = code.toLowerCase()
    const vendor = _req.headers["parent"]
    const updatedBy = _req.headers["user"]
    // === Field Validations ===
    if (!vendor) return _res.status(400).json(error(400, "Missing 'vendor' in headers."))
    if (!updatedBy) return _res.status(400).json(error(400, "Missing 'user' in headers."))

    if (!name || typeof name !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'name'. It must be a non-empty string."))
    }

    if (!code || typeof code !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'code'. It must be a non-empty string."))
    }

    if (!category_id || typeof category_id !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'category_id'. It must be a string."))
    }

    if (price === undefined || typeof price !== "number" || price < 0) {
        return _res.status(400).json(error(400, "Invalid or missing 'price'. It must be a non-negative number."))
    }

    if (qty === undefined || typeof qty !== "number" || qty < 0) {
        return _res.status(400).json(error(400, "Invalid or missing 'qty'. It must be a non-negative number."))
    }

    if (discount !== undefined && (typeof discount !== "number" || discount < 0)) {
        return _res.status(400).json(error(400, "'discount' must be a non-negative number if provided."))
    }

    if (!type || typeof type !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'type'. It must be a string."))
    }

    // if (!status || typeof status !== "string") {
    //     return _res.status(400).json(error(400, "Invalid or missing 'status'. It must be a string."))
    // }

    if (total_price_with_gst !== undefined && (typeof total_price_with_gst !== "number" || total_price_with_gst < 0)) {
        return _res.status(400).json(error(400, "'total_price_with_gst' must be a non-negative number if provided."))
    }

    if (gst_percentage !== undefined && (typeof gst_percentage !== "number" || gst_percentage < 0)) {
        return _res.status(400).json(error(400, "'gst_percentage' must be a non-negative number if provided."))
    }

    if (note !== undefined && typeof note !== "string") {
        return _res.status(400).json(error(400, "'note' must be a string if provided."))
    }
    if (_id !== undefined && typeof _id !== "string") {
        return _res.status(400).json(error(400, "'_id' must be a string if provided."))
    }
    const handle = handleConverter(name)
    const currentMenu = await MenusModal.findById(_id);
    if (!currentMenu) {
        return _res.status(404).json(error(404, "Menu item not found."));
    }
    const isNameChanged = currentMenu.name !== name;
    const isCodeChanged = currentMenu.code !== newCode;
    if (isNameChanged || isCodeChanged) {
        const exist = await MenusModal.findOne({
            vendor,
            _id: { $ne: _id },
            handle,
        });


        if (exist) {
            return _res.status(400).json(error(400, "Menu already exists with this name or code."));
        }
    }
    const update = await MenusModal.findByIdAndUpdate(
        _id,
        {
            category_id,
            note,
            code: newCode,
            qty,
            price,
            name,
            discount,
            image,
            type,
            status,
            total_price_with_gst,
            gst_percentage,
            updatedBy

        },
        { new: true }

    )

    return _res.json(success(update))

}
const getMenus = async (_req, _res) => {
    let vendor = _req.headers["parent"]
    vendor = new mongoose.Types.ObjectId(vendor);
    const page = parseInt(_req.query.page) + 1 || 1;
    const limit = parseInt(_req.query.page_size) || 15;
    const skip = (page - 1) * limit;
    const search = _req.query.search || "";

    const result = await MenusModal.aggregate([
        {
            $match: {
                vendor,
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { code: { $regex: search, $options: "i" } },
                    { price: { $regex: search, $options: "i" } },
                    { type: { $regex: search, $options: "i" } },
                    { handle: { $regex: search, $options: "i" } },
                ]

            }
        },
        {
            $facet: {
                data: [
                    { $sort: { createdAt: 1 } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "category_id",
                            foreignField: "_id",
                            as: "category"
                        }
                    },
                    {
                        $unwind: {
                            path: "$category",
                            preserveNullAndEmptyArrays: true // keeps documents even if category not found
                        }
                    },
                    {
                        $lookup: {
                            from: "variants",
                            localField: "_id",
                            foreignField: "menu_id",
                            as: "totalVariants"
                        }
                    },
                    {
                        $project: {
                            category_id: 0,
                        }
                    }
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ]);
    let menus = result[0].data;
    const cache = new Map();

    menus = await Promise.all(menus.map(async (item) => {
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
        menus,
        total,
        page,
        limit,
        Math.ceil(total / limit)
    ))

}
const getActiveMenus = async (_req, _res) => {
    let vendor = _req.headers["parent"]
    vendor = new mongoose.Types.ObjectId(vendor);
    const menus = await MenusModal.find({ vendor, status: true })
    return _res.json(success(
        menus,
    ))

}
module.exports = { addMenu, getMenus, updateMenu, getActiveMenus }