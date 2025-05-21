const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories',
        required: true,
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    note: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    handle: {
        type: String,
        required: true,
    },
    qty: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
    },
    type: {
        type: String,
        required: true,
        enum: ["veg", "non-veg"]

    },
    trending: {
        type: Boolean,
        default: false
    },
    hasVariant: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: true,
        enum: [true, false]
    },
    gst_percentage: {
        type: Number,  // For example: 5 means 5%
        required: true,
        min: 0,
        max: 100,
    },
    total_price_with_gst: {
        type: Number,  // For example: 5 means 5%
        required: true,
    },
},
    {
        timestamps: true // Automatically adds createdAt and updatedAt
    });

const MenusModal = mongoose.model('menus', menuSchema);
module.exports = { MenusModal }
