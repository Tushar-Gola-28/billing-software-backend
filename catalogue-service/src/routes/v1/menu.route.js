const express = require("express")
const { asyncHandler } = require("../../middleware/error-handler")
const { addMenu, updateMenu, getMenus, getActiveMenus } = require("../../controllers/v1/menu.controllers")
const menuRoute = express.Router()

menuRoute.post("/menu", asyncHandler(addMenu))
menuRoute.get("/menus", asyncHandler(getMenus))
menuRoute.get("/active-menus", asyncHandler(getActiveMenus))
menuRoute.put("/menu", asyncHandler(updateMenu))
module.exports = { menuRoute }