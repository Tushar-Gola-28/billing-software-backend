const express = require("express")
const { asyncHandler } = require("../../middleware/error-handler")
const { addMenu, updateMenu, getMenus } = require("../../controllers/v1/menu.controllers")
const menuRoute = express.Router()

menuRoute.post("/menu", asyncHandler(addMenu))
menuRoute.get("/menus", asyncHandler(getMenus))
menuRoute.put("/menu", asyncHandler(updateMenu))
module.exports = { menuRoute }