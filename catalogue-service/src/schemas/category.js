const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
    },
    handle: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true // Automatically adds createdAt and updatedAt
    });
const CategoryModal = mongoose.model('categories', categorySchema);
module.exports = { CategoryModal }
