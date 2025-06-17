const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrst', 10);
const billOrderSchema = new mongoose.Schema({
    sell_by: {
        type: String,
        required: true,
        enum: ["dine-in", "delivery", "pick-up"]
    },
    total_amount: {
        type: Number,
        required: true,
    },
    total_discount: {
        type: Number,
        required: true,
    },
    total_cgst: {
        type: Number,
        required: true,
    },
    total_sgst: {
        type: Number,
        required: true,
    },
    total_items: {
        type: Number,
        required: true,
    },
    bill_no: {
        type: Number,
        required: true,
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    note: {
        type: String,
        required: true
    },
    order_id: {
        type: String,
        default: () => `ORDER_${nanoid().toUpperCase()}`,
        required: true,
    },
    bill_status: {
        type: String,
        enum: ['PAID', 'UNPAID', 'CANCELLED'],
        required: true,
    },
    payment_mode: {
        type: String,
        required: true,
        enum: ["Cash", "Card", "UPI", "Others", "No Payment"]
    },
    payment_status: {
        type: Boolean,
        require: false
    },
    items: {
        type: [
            {
                menu_id: { type: mongoose.Schema.Types.ObjectId, ref: 'menus', require: true },
                selected_qty: { type: Number, require: true },
                price: {
                    type: Number,
                    required: true,
                },
                discount: {
                    type: Number,
                    required: true,
                },
                type: {
                    type: String,
                    required: true,
                    enum: ["veg", "non-veg"]

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
                name: {
                    type: String,  // For example: 5 means 5%
                    required: true,
                },
            }
        ],
        require: true
    },
    deleted: {
        type: Boolean,
        default: false
    },
    tax_type: {
        type: String,
        enum: ['INCLUSIVE', 'EXCLUSIVE'],
        default: 'EXCLUSIVE'
    },
},
    {
        timestamps: true // Automatically adds createdAt and updatedAt
    });
const BillOrderModal = mongoose.model('billOrders', billOrderSchema);
module.exports = { BillOrderModal }
