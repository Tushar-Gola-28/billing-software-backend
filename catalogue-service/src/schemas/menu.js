const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories',
        required: true,
    },
    note: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    handle: {
        type: String,
        required: true,
        unique: true
    },
    qty: {
        type: String,
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
        default: true
    }
},
    {
        timestamps: true // Automatically adds createdAt and updatedAt
    });

const MenusModal = mongoose.model('menus', menuSchema);
module.exports = { MenusModal }
