const { default: mongoose } = require("mongoose")
const { success, handleConverter, success_with_page, error } = require("../../functions/functions")
const { CategoryModal } = require("../../schemas/category")
const axios = require("axios")
const addCategory = async (_req, _res) => {
    const { name = "", code = "", description = "" } = _req.body || {}
    if (!name.trim()) {
        return _res.status(400).json(error(400, `Name is required.`))
    }
    if (!code.trim()) {
        return _res.status(400).json(error(400, `Code is required.`))
    }
    if (!description.trim()) {
        return _res.status(400).json(error(400, `Description is required.`))
    }
    const vendor = _req.headers["parent"]
    const user = _req.headers["user"]
    const newCode = code.toLowerCase()
    const exist = await CategoryModal.findOne({
        vendor,
        $or: [
            { name },
            { code: newCode }
        ]
    });
    if (exist) {
        const conflictField = exist.name === name ? "name" : "code";
        return _res.status(400).json(error(400, `Category with this ${conflictField} already exists for this vendor.`))
    }
    const create = new CategoryModal({ name, code: newCode, description, handle: handleConverter(name), vendor, user })
    await create.save()
    return _res.json(success(create))
}
const getActiveCategory = async (_req, _res) => {
    let vendor = _req.headers["parent"]
    const categories = await CategoryModal.find({ vendor, status: true }, { _id: 1, name: 1, code: 1 })
    return _res.json(success(categories))
}
const updateCategory = async (_req, _res) => {
    const { name, code, description, _id, status } = _req.body || {}
    if (!name.trim()) {
        return _res.status(400).json(error(400, `Name is required.`))
    }
    if (!code.trim()) {
        return _res.status(400).json(error(400, `Code is required.`))
    }
    if (!description.trim()) {
        return _res.status(400).json(error(400, `Description is required.`))
    }
    const newCode = code.toLowerCase()
    const updatedBy = _req.headers["user"]
    const update = await CategoryModal.findByIdAndUpdate(
        _id,
        { name, code: newCode, description, updatedBy, status },
        { new: true }
    );
    return _res.json(success(update))

}
const getCategory = async (_req, _res) => {
    let vendor = _req.headers["parent"]
    vendor = new mongoose.Types.ObjectId(vendor);
    const page = parseInt(_req.query.page) + 1 || 1;
    const limit = parseInt(_req.query.page_size) || 15;
    const skip = (page - 1) * limit;
    const search = _req.query.search || "";
    const s = {}
    if (search) {
        s.$or = [
            { name: { $regex: search, $options: "i" } },
            { code: { $regex: search, $options: "i" } }
        ]
    }
    const result = await CategoryModal.aggregate([
        {
            $match: {
                vendor,
                ...s,
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
                            from: "menus",
                            let: { categoryId: "$_id", vendorId: "$vendor" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$category_id", "$$categoryId"] },
                                                { $eq: ["$vendor", "$$vendorId"] }
                                            ]
                                        }
                                    }
                                }
                            ],
                            as: "menuData"
                        }
                    },

                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ]);


    let categories = result[0].data;
    const cache = new Map();

    categories = await Promise.all(categories.map(async (item) => {
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
        categories,
        total,
        page,
        limit,
        Math.ceil(total / limit)
    ))

}


const getActiveMenuAndCategory = async (_req, _res) => {
    let vendor = _req.headers["parent"]
    vendor = new mongoose.Types.ObjectId(vendor);
    const search = _req.query.search || "";
    const s = {}
    const m = {}
    if (search) {
        s.$or = [
            { code: { $regex: search, $options: "i" } }
        ]
    }

    if (search) {
        m.$or = [
            { "menus.code": { $regex: search, $options: "i" } }
        ]
    }

    const result = await CategoryModal.aggregate([
        {
            $match: {
                vendor: vendor,
                status: true,
                ...s
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $lookup: {
                from: "menus",
                localField: "_id",
                foreignField: "category_id",
                as: "menus"
            }
        },
        { $unwind: "$menus" },
        {
            $match: {
                ...m
            }
        },
        {
            $lookup: {
                from: "variants",
                let: { menuId: "$menus._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$menu_id", "$$menuId"] },
                            status: true,
                        }
                    },
                    {
                        $lookup: {
                            from: "addons",
                            localField: "_id",
                            foreignField: "variant_id",
                            as: "addons"
                        }
                    }
                ],
                as: "menus.variants"
            }
        },
        {
            $group: {
                _id: "$_id",
                vendor: { $first: "$vendor" },
                name: { $first: "$name" },
                status: { $first: "$status" },
                code: { $first: "$code" },
                description: { $first: "$description" },
                menus: { $push: "$menus" }
            }
        }
    ]

    );


    return _res.json(success(
        result,
    ))

}
module.exports = { addCategory, getCategory, updateCategory, getActiveCategory, getActiveMenuAndCategory }