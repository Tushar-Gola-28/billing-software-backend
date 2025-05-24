const mongoose = require('mongoose');

const addOnSchema = new mongoose.Schema({
    menu_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'menus',
        required: true,
    },
    variant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'variants',
        required: true,
    },
    note: {
        type: String,
        required: true
    },
    handle: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    addOnPrice: {
        type: Number,
    },
    price: {
        type: Number,
        required: true,
    },
    priceChangeable: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },

},
    {
        timestamps: true // Automatically adds createdAt and updatedAt
    });

const AddOnModal = mongoose.model('addOns', addOnSchema);
module.exports = { AddOnModal }
