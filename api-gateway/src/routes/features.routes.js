const express = require("express")
const { asyncHandler } = require("../middleware/error-handler")
const { createFeature, getFeatures, getFeatureByName } = require("../controllers/v1/feature")
const featureRoute = express.Router()


featureRoute.route("/features").post(asyncHandler(createFeature)).get(asyncHandler(getFeatures))
featureRoute.route("/features/:name").get(asyncHandler(getFeatureByName))

module.exports = { featureRoute }