const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrst', 10);
const variantSchema = new mongoose.Schema({
    menu_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'menus',
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
    handle: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        default: true
    },
    isMultiple: {
        type: Boolean,
        default: false
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    index: {
        type: Number,
        default: 1
    },
    minQty: {
        type: Number,
        default: 0
    },
    menu_tracking_id: {
        type: String,
        unique: true,
        default: () => `variant_${nanoid()}`
    },
    type: {
        type: String,
        required: true,
        enum: ["veg", "non-veg"]

    },

},
    {
        timestamps: true // Automatically adds createdAt and updatedAt
    });
// ✅ Compound unique index: menu_id + name
variantSchema.index({ menu_id: 1, name: 1 }, { unique: true });
const VariantModal = mongoose.model('variants', variantSchema);
module.exports = { VariantModal }
