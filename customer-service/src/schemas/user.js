const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    profile: {
        type: String,
        default: ""
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    role: {
        type: String,
        default: null
    },
    mobile: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    countryCode: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    type: {
        type: String,
        index: true,
        default:"vendor"
    },
    status: {
        type: Boolean,
        default: true,
        index: true,
    },
    password: {
        type: String,
        validate: {
            validator: function (value) {
                if (this.type !== "customer") {
                    return typeof value === "string" && value.trim().length > 0;
                }
                return true;
            },
            message: "Password is required for non-customer users"
        }
    },
    loginCount: {
        type: Number,
        default: 0
    },
    inActiveReason: {
        type: String,
        default: null
    },
},
    {
        timestamps: true // Automatically adds createdAt and updatedAt
    });

const UserModal = mongoose.model('users', userSchema);
module.exports = { UserModal }
