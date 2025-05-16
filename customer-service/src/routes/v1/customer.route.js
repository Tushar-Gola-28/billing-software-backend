const express = require("express")
const { asyncHandler } = require("../../middleware/error-handler")
const { createVendor, loginUser, verifyUserById, suggestUserOnlyCustomer, addVendorCustomer, refreshToken, logoutUser } = require("../../controllers/v1/customer.controllers")
const route = express.Router()


route.post("/no-auth/vendor", asyncHandler(createVendor))
route.post("/customer", asyncHandler(addVendorCustomer))
route.post("/no-auth/login", asyncHandler(loginUser))
route.get("/no-auth/verify/:id", asyncHandler(verifyUserById))
route.post("/suggest", asyncHandler(suggestUserOnlyCustomer))
route.post("/refresh-token", asyncHandler(refreshToken))
route.post("/logout", asyncHandler(logoutUser))

module.exports = route