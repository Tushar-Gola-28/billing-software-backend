const express = require("express")
const { asyncHandler } = require("../../middleware/error-handler")
const { addBill, getNextBillNo, getOrderList, getOrderInfoByOrderId, updateBill } = require("../../controllers/v1/order.controllers")
const orderRoute = express.Router()

orderRoute.post("/order-generate", asyncHandler(addBill))
orderRoute.put("/order-generate", asyncHandler(updateBill))
orderRoute.post("/bill-no", asyncHandler(getNextBillNo))
orderRoute.get("/orders", asyncHandler(getOrderList))
orderRoute.get("/orders/:order_id", asyncHandler(getOrderInfoByOrderId))

module.exports = { orderRoute } 