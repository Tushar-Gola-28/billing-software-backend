const express = require("express")
const { asyncHandler } = require("../middleware/error-handler")
const { createVersion, getVersions, getVersionsByCode } = require("../controllers/v1/versions")
const versionRoute = express.Router()

versionRoute.route("/version").post(asyncHandler(createVersion)).get(asyncHandler(getVersions))
versionRoute.route("/version/:code/:featureName").get(asyncHandler(getVersionsByCode))

module.exports = { versionRoute }   