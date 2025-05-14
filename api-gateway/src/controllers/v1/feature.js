const { error, success } = require("../../functions/functions")
const { FeatureModal } = require("../../schemas/feature")

const createFeature = async (_req, _res) => {
    const body = _req?.body || {}
    const { name, description } = body
    if (!_req?.body) {
        return _res.json(error(400, "Feature name and description is required."))
    }

    if (!String(name).trim()) {
        return _res.json(error(400, "Feature name is required."))
    }

    if (!String(description).trim()) {
        return _res.json(error(400, "Feature description is required."))
    }
    const feature = await FeatureModal.findOne({ name: name.trim() })

    if (feature) {
        return _res.json(error(400, `${name} feature is already exist.`))
    }

    const create = new FeatureModal(body)
    await create.save()
    return _res.status(201).json(success(create))
}
const getFeatures = async (_req, _res) => {
    const getAllData = await FeatureModal.find()
    return _res.json(success(getAllData))
}
const getFeatureByName = async (_req, _res) => {
    const params = _req.params
    const getAllData = await FeatureModal.findOne({ name: params.name })
    return _res.json(success(getAllData))
}


module.exports = { createFeature, getFeatures, getFeatureByName }