const { default: mongoose } = require("mongoose");

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    handle: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    joining_till: {
        type: Number,
        required: true
    },
    joining_till_type: {
        type: String,
        required: true,
        enum: ["days", "weeks", "years"]
    },
    description: {
        type: [String],
        // required: true,
        default: [],

    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
})
const PlanModal = mongoose.model("plan", planSchema)

module.exports = { PlanModal }