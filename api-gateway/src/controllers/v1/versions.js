const { default: mongoose } = require("mongoose")
const { error, success } = require("../../functions/functions")
const { VersionModal } = require("../../schemas/version")

const createVersion = async (_req, _res) => {
    const body = _req?.body || {}
    const { code, description, featureId, featureName } = body
    if (!_req?.body) {
        return _res.json(error(400, "Feature name and description is required."))
    }

    if (!String(code).trim()) {
        return _res.json(error(400, "Feature name is required."))
    }

    if (!String(description).trim()) {
        return _res.json(error(400, "Feature description is required."))
    }
    const feature = await VersionModal.findOne({ code: code.trim(), featureName: featureName.trim() })

    if (feature) {
        return _res.json(error(400, `${code} feature is already exist.`))
    }

    const create = new VersionModal({ code, description, featureId: new mongoose.Types.ObjectId(featureId), featureName })
    await create.save()
    return _res.status(201).json(success(create))
}

const getVersions = async (_req, _res) => {
    const getAllData = await VersionModal.find()
    return _res.json(success(getAllData))
}
const getVersionsByCode = async (_req, _res) => {
    const { code, featureName } = _req.params
    const versiondata = await VersionModal.findOne({ code, featureName })

    if (!versiondata) {
        return _res.json(error(400, `Version ${code} and feature ${featureName} is not present.`))
    }

    return _res.json(success(versiondata))
}
module.exports = { createVersion, getVersions, getVersionsByCode }