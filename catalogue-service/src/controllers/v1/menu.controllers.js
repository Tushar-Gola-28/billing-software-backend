const { default: mongoose } = require("mongoose")
const { success, handleConverter, success_with_page, error } = require("../../functions/functions")
const { MenusModal } = require("../../schemas/menu")

const addMenu = async (_req, _res) => {
    const { category_id, note, code, qty, price, name, discount, image, type, status, total_price_with_gst, gst_percentage } = _req.body || {}
    const vendor = _req.headers["parent"]
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
    const create = new MenusModal({ name, code: newCode, note, handle: handleConverter(name), vendor, category_id, price, qty, discount, image, type, status, total_price_with_gst, gst_percentage })
    await create.save()
    return _res.json(success(create))

}
const updateMenu = async (_req, _res) => {
    const { category_id, note, code, qty, price, name, discount, image, type, status, _id, total_price_with_gst, gst_percentage } = _req.body || {}
    const newCode = code.toLowerCase()
    const vendor = _req.headers["parent"]
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
            gst_percentage

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
    const menus = result[0].data;
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