const express = require("express")
const { asyncHandler } = require("../../middleware/error-handler")
const { addVariants, getVariants, updateVariants, getVariantsById, getMenuVariants, addVariantsAddOns, getAddons } = require("../../controllers/v1/variants.controllers")
const variantRoute = express.Router()

variantRoute.post("/variant", asyncHandler(addVariants))
variantRoute.put("/variant", asyncHandler(updateVariants))
variantRoute.get("/variant", asyncHandler(getVariants))
variantRoute.get("/add-ons", asyncHandler(getAddons))
variantRoute.get("/variant/:variant", asyncHandler(getVariantsById))
variantRoute.get("/menu-variant/:menu_id", asyncHandler(getMenuVariants))
variantRoute.post("/add-variant-add-ons", asyncHandler(addVariantsAddOns))
module.exports = { variantRoute }