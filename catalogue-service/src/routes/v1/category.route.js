const express = require("express")
const { asyncHandler } = require("../../middleware/error-handler")
const { addCategory, getCategory, updateCategory } = require("../../controllers/v1/category.controllers")
const categoryRoute = express.Router()

categoryRoute.post("/category", asyncHandler(addCategory))
categoryRoute.get("/category", asyncHandler(getCategory))
categoryRoute.put("/category", asyncHandler(updateCategory))
module.exports = { categoryRoute }