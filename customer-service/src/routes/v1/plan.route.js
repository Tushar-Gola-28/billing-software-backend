const express = require("express")
const { asyncHandler } = require("../../middleware/error-handler")
const { createPlan, getAllPlan, getAllCustomerPlans, customerPlansAdd } = require("../../controllers/v1/plans.controllers")
const planRoute = express.Router()


planRoute.post("/no-auth/plan", asyncHandler(createPlan))
planRoute.get("/no-auth/plans", asyncHandler(getAllPlan))
planRoute.get("/no-auth/customer-plans/:customer_id", asyncHandler(getAllCustomerPlans))
planRoute.post("/customer-plan/add", asyncHandler(customerPlansAdd))

module.exports = planRoute