const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    menu_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'menus',
        required: true,
    },
    note: {
        type: String,
        required: true
    },
    handle: {
        type: String,
        required: true,
        unique: true
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
    addOnPrice: {
        type: Number,
        default: 0
    },
    minQty: {
        type: Number,
        default: 0
    },

},
    {
        timestamps: true // Automatically adds createdAt and updatedAt
    });
// ✅ Compound unique index: menu_id + name
variantSchema.index({ menu_id: 1, name: 1 }, { unique: true });
variantSchema.index({ menu_id: 1, index: 1 }, { unique: true });
const VariantModal = mongoose.model('variants', variantSchema);
module.exports = { VariantModal }
