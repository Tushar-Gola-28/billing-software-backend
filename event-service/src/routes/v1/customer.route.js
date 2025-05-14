const express = require("express")
const { asyncHandler } = require("../../middleware/error-handler")
const { addCustomer } = require("../../controllers/v1/customer.controllers")
const route = express.Router()


route.get("/event", asyncHandler(addCustomer))
route.get("/event/:id", asyncHandler(addCustomer))

module.exports = route