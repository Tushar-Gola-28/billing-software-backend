const { default: mongoose } = require("mongoose")
const { handleConverter, success, error, success_with_page } = require("../../functions/functions")
const { VariantModal } = require("../../schemas/variant")
const { AddOnModal } = require("../../schemas/addon")
const axios = require("axios")
const addVariants = async (_req, _res) => {
    const { name, menu_id, status, isMultiple, minQty, note, type } = _req.body || {}
    let vendor = _req.headers["parent"]
    const user = _req.headers["user"]
    // === Required Field Validations ===
    if (!vendor || typeof vendor !== "string") {
        return _res.status(400).json(error(400, "Missing or invalid 'vendor' in headers."))
    }

    if (!user || typeof user !== "string") {
        return _res.status(400).json(error(400, "Missing or invalid 'user' in headers."))
    }

    if (!name || typeof name !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'name'. It must be a non-empty string."))
    }

    if (!menu_id || typeof menu_id !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'menu_id'. It must be a non-empty string."))
    }

    if (!status || typeof status !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'status'. It must be a non-empty string."))
    }

    if (typeof isMultiple !== "boolean") {
        return _res.status(400).json(error(400, "Invalid or missing 'isMultiple'. It must be a boolean."))
    }

    if (minQty === undefined || typeof minQty !== "number" || minQty < 0) {
        return _res.status(400).json(error(400, "Invalid or missing 'minQty'. It must be a non-negative number."))
    }

    if (!type || typeof type !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'type'. It must be a non-empty string."))
    }

    if (note !== undefined && typeof note !== "string") {
        return _res.status(400).json(error(400, "'note' must be a string if provided."))
    }
    const handle = handleConverter(name)

    const exist = await VariantModal.findOne({ menu_id, handle, vendor })

    if (exist) {
        return _res.status(400).json(error(400, "Variant Already exist for the menu"))
    }

    const create = new VariantModal({ name, menu_id, status, isMultiple, minQty, vendor, handle, note, type, user })
    await create.save()
    return _res.json(success(create))
}
const updateVariants = async (_req, _res) => {
    const { name, menu_id, status, isMultiple, minQty, note, type, _id } = _req.body || {}
    let vendor = _req.headers["parent"]
    const updatedBy = _req.headers["user"]
    // === Required Field Validations ===
    if (!vendor || typeof vendor !== "string") {
        return _res.status(400).json(error(400, "Missing or invalid 'vendor' in headers."))
    }

    if (!updatedBy || typeof user !== "string") {
        return _res.status(400).json(error(400, "Missing or invalid 'user' in headers."))
    }

    if (!name || typeof name !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'name'. It must be a non-empty string."))
    }

    if (!menu_id || typeof menu_id !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'menu_id'. It must be a non-empty string."))
    }

    if (!status || typeof status !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'status'. It must be a non-empty string."))
    }

    if (typeof isMultiple !== "boolean") {
        return _res.status(400).json(error(400, "Invalid or missing 'isMultiple'. It must be a boolean."))
    }

    if (minQty === undefined || typeof minQty !== "number" || minQty < 0) {
        return _res.status(400).json(error(400, "Invalid or missing 'minQty'. It must be a non-negative number."))
    }

    if (!type || typeof type !== "string") {
        return _res.status(400).json(error(400, "Invalid or missing 'type'. It must be a non-empty string."))
    }

    if (note !== undefined && typeof note !== "string") {
        return _res.status(400).json(error(400, "'note' must be a string if provided."))
    }
    const handle = handleConverter(name)
    const currentVariant = await VariantModal.findById(_id);
    if (!currentVariant) {
        return _res.status(404).json(error(404, "Variant not found."));
    }
    const isNameChanged = currentVariant.name !== name;
    if (isNameChanged) {
        const exist = await VariantModal.findOne({
            vendor,
            _id: { $ne: _id },
            handle,
        });


        if (exist) {
            return _res.status(400).json(error(400, "Variant already exists with this name."));
        }
    }


    const update = await VariantModal.findByIdAndUpdate(_id, { name, menu_id, status, isMultiple, minQty, vendor, handle, note, type, updatedBy }, { new: true })
    return _res.json(success(update))
}
const getVariants = async (_req, _res) => {
    let vendor = _req.headers["parent"]
    vendor = new mongoose.Types.ObjectId(vendor);
    const page = parseInt(_req.query.page) + 1 || 1;
    const limit = parseInt(_req.query.page_size) || 15;
    const skip = (page - 1) * limit;
    const search = _req.query.search || "";

    const result = await VariantModal.aggregate([
        {
            $match: {
                vendor,
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { menu_tracking_id: { $regex: search, $options: "i" } },
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
                            from: "menus",
                            localField: "menu_id",
                            foreignField: "_id",
                            as: "menu"
                        }
                    },
                    {
                        $unwind: {
                            path: "$menu",
                            preserveNullAndEmptyArrays: true
                        }
                    }
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ])

    let variants = result[0].data;
    const cache = new Map();

    variants = await Promise.all(variants.map(async (item) => {
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
    return _res.json(success_with_page(variants, total, page, limit, Math.ceil(total / limit)))
}
const getAddons = async (_req, _res) => {
    let vendor = _req.headers["parent"]
    vendor = new mongoose.Types.ObjectId(vendor);
    const page = parseInt(_req.query.page) + 1 || 1;
    const limit = parseInt(_req.query.page_size) || 15;
    const skip = (page - 1) * limit;
    const search = _req.query.search || "";

    const result = await AddOnModal.aggregate([
        {
            $match: {
                vendor,
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { menu_tracking_id: { $regex: search, $options: "i" } },
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
                            from: "menus",
                            localField: "menu_id",
                            foreignField: "_id",
                            as: "menu"
                        }
                    },
                    {
                        $unwind: {
                            path: "$menu",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: "variants",
                            localField: "variant_id",
                            foreignField: "_id",
                            as: "variants"
                        }
                    },
                    {
                        $unwind: {
                            path: "$variants",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ])

    let addons = result[0].data;
    const cache = new Map();

    addons = await Promise.all(addons.map(async (item) => {
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
    return _res.json(success_with_page(addons, total, page, limit, Math.ceil(total / limit)))
}

const getVariantsById = async (_req, _res) => {
    const { variant } = _req.params || {}
    if (!variant) {
        _res.status(400).json(error(400, "Variant Id is required.."));
    }

    const data = await VariantModal.findOne({ _id: variant })
    return _res.json(success(data))

}
const getMenuVariants = async (_req, _res) => {
    const { menu_id } = _req.params || {}
    if (!menu_id) {
        _res.status(400).json(error(400, "Menu Id is required.."));
    }

    const data = await VariantModal.aggregate([
        { $match: { menu_id: new mongoose.Types.ObjectId(menu_id) } },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "addons",
                localField: "_id",
                foreignField: "variant_id",
                as: "addOns"
            }
        }
    ])
    console.log(data);

    return _res.json(success(data))

}
const addVariantsAddOns = async (_req, _res) => {
    const { data, menu_id } = _req.body || {}
    let vendor = _req.headers["parent"]
    let user = _req.headers["user"]
    await AddOnModal.deleteMany({ menu_id });
    const operations = data.flatMap((it) => it.addOns.map((ite) => {
        return {
            insertOne: {
                document: {
                    ...ite,
                    handle: handleConverter(ite.name),
                    addOnPrice: ite.addOnPrice ? Number(ite.addOnPrice) : 0,
                    price: ite.price ? Number(ite.price) : 0,
                    status: ite.status == "true" || ite.status == true ? true : false,
                    vendor,
                    user

                }
            }

        }
    }))

    if (operations.length === 0) {
        return _res.status(400).json(error(400, "No add-ons to insert"));
    }
    const create = await AddOnModal.bulkWrite(operations)
    return _res.json(success(create))

}

module.exports = { addVariants, getVariants, updateVariants, getVariantsById, getMenuVariants, addVariantsAddOns, getAddons }