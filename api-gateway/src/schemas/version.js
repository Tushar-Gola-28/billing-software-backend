const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
    description: {
        type: String
    },
    featureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "features", // This should match the model name of your Feature schema
        required: true,
    },
    featureName: {
        type: String,
        required: true,
    },
    code: {
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

const VersionModal = mongoose.model('versions', versionSchema);
module.exports = { VersionModal }
