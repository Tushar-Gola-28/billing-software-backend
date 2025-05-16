const { default: mongoose } = require("mongoose")
const { success, handleConverter, success_with_page, error } = require("../../functions/functions")
const { CategoryModal } = require("../../schemas/category")

const addCategory = async (_req, _res) => {
    const { name, code, description } = _req.body || {}
    const vendor = _req.headers["parent"]
    const newCode = code.toLowerCase()
    const exist = await CategoryModal.findOne({
        vendor,
        $or: [
            { name },
            { code:newCode }
        ]
    });
    if (exist) {
        const conflictField = exist.name === name ? "name" : "code";
        return _res.status(400).json(error(`Category with this ${conflictField} already exists for this vendor.`))
    }
    const create = new CategoryModal({ name, code: newCode, description, handle: handleConverter(name), vendor })
    await create.save()
    return _res.json(success(create))

}
const getCategory = async (_req, _res) => {
    let vendor = _req.headers["parent"]
    vendor = new mongoose.Types.ObjectId(vendor);
    const page = parseInt(_req.query.page) + 1 || 1;
    const limit = parseInt(_req.query.page_size) || 15;
    const skip = (page - 1) * limit;
    const search = _req.query.search || "";

    const result = await CategoryModal.aggregate([
        {
            $match: {
                vendor,
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { code: { $regex: search, $options: "i" } }
                ]

            }
        },
        {
            $facet: {
                data: [
                    { $sort: { createdAt: 1 } },
                    { $skip: skip },
                    { $limit: limit }
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ]);
    const categories = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;
    return _res.json(success_with_page(
        categories,
        total,
        page,
        limit,
        Math.ceil(total / limit)
    ))

}
module.exports = { addCategory, getCategory }