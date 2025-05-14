const { error, success, handleConverter } = require("../../functions/functions");
const { CustomerPlanModal } = require("../../schemas/customer-plan");
const { PlanModal } = require("../../schemas/plan");
const moment = require("moment");

const createPlan = async (_req, _res) => {
    const { name, price, joining_till, joining_till_type, description } = _req.body || {}

    if (!name?.trim()) {
        return _res.status(400).json(error(400, "Name is required."));
    }
    if (price == undefined) {
        return _res.status(400).json(error(400, "Price is required."));
    }
    if (typeof price != "number") {
        return _res.status(400).json(error(400, "Price should be number."));
    }
    if (joining_till == undefined) {
        return _res.status(400).json(error(400, "Joining till is required."));
    }
    if (!joining_till_type.trim()) {
        return _res.status(400).json(error(400, "Joining till type is required."));
    }

    const createdPlan = new PlanModal({ name, price, joining_till, joining_till_type, handle: handleConverter(name), description })
    await createdPlan.save()
    return _res.status(200).json(success(createdPlan));
}
const getAllPlan = async (_req, _res) => {
    const allPlan = await PlanModal.find({})
    return _res.status(200).json(success(allPlan));
}
const getAllCustomerPlans = async (_req, _res) => {
    const allCustomerPlans = await CustomerPlanModal.find({ customer_id: _req.params.customer_id, status: true })
    return _res.status(200).json(success(allCustomerPlans));
}
const customerPlansAdd = async (_req, _res) => {
    const vendor = _req.headers["parent"]
    const { plan_id, payment_status, previous_plan_amount_remove, total_paid } = _req.body
    const findPlan = await PlanModal.findOne({ _id: plan_id })
    const checkPreviousPlan = await CustomerPlanModal.findOne({
        customer_id: vendor,
        plan_id: plan_id,
        status: true
    })
    const total = findPlan.price - (checkPreviousPlan?.amount_paid || 0)
    if (total != total_paid) {
        return _res.status(400).json(error(400, "Total amount does not match.."));
    }
    const convertDate = moment(new Date())
        .add(findPlan.joining_till, findPlan.joining_till_type)
        .hour(23)
        .minute(59)
        .second(59)
        .millisecond(59)
    await CustomerPlanModal.updateMany(
        { customer_id: vendor, status: true }, // Find existing active plans for this vendor
        { $set: { status: false } } // Set the status to false for these plans
    );
    const customerPlans = await CustomerPlanModal.create({
        customer_id: vendor,
        plan_id: plan_id,
        expire: convertDate,
        payment_status: payment_status,
        status: true,
        amount_paid: total,
        previous_plan_amount_remove: checkPreviousPlan?.amount_paid || 0
    })
    return _res.status(200).json(success(customerPlans));
}


module.exports = { createPlan, getAllPlan, getAllCustomerPlans, customerPlansAdd }