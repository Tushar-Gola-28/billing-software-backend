const { default: mongoose } = require("mongoose")
const { handleConverter, success, error, success_with_page } = require("../../functions/functions")
const { VariantModal } = require("../../schemas/variant")

const addVariants = async (_req, _res) => {
    const { name, menu_id, status, isMultiple, minQty, note, type } = _req.body || {}
    let vendor = _req.headers["parent"]
    const handle = handleConverter(name)

    const exist = await VariantModal.findOne({ menu_id, handle, vendor })

    if (exist) {
        return _res.status(400).json(error(400, "Variant Already exist for the menu"))
    }

    const create = new VariantModal({ name, menu_id, status, isMultiple, minQty, vendor, handle, note, type })
    await create.save()
    return _res.json(success(create))
}
const updateVariants = async (_req, _res) => {
    const { name, menu_id, status, isMultiple, minQty, note, type, _id } = _req.body || {}
    let vendor = _req.headers["parent"]
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


    const update = await VariantModal.findByIdAndUpdate(_id, { name, menu_id, status, isMultiple, minQty, vendor, handle, note, type }, { new: true })
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

    const variants = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;
    return _res.json(success_with_page(variants, total, page, limit, Math.ceil(total / limit)))
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

    const data = await VariantModal.find({ menu_id: menu_id })
    return _res.json(success(data))

}
module.exports = { addVariants, getVariants, updateVariants, getVariantsById, getMenuVariants }