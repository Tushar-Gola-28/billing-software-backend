const express = require("express")
const { asyncHandler } = require("../../middleware/error-handler")
const { addCategory, getCategory } = require("../../controllers/v1/category.controllers")
const categoryRoute = express.Router()

categoryRoute.post("/category", asyncHandler(addCategory))
categoryRoute.get("/category", asyncHandler(getCategory))
module.exports = { categoryRoute }