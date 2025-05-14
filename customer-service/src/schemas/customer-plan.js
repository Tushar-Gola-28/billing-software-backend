const { default: mongoose } = require("mongoose");

const customerPlanSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    plan_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    expire: {
        type: Date,
        required: true
    },
    payment_status: {
        type: String,
        required: true,
        enum: ["pending", "paid", "failed"]
    },
    amount_paid: {
        type: Number
    },
    previous_plan_amount_remove: {
        type: Number
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
})
const CustomerPlanModal = mongoose.model("customerPlan", customerPlanSchema)

module.exports = { CustomerPlanModal }