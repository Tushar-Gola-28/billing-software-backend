const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
    description: {
        type: String
    },
    name: {
        type: String
    },
    status: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true // Automatically adds createdAt and updatedAt
    });

const FeatureModal = mongoose.model('features', featureSchema);
module.exports = { FeatureModal }
