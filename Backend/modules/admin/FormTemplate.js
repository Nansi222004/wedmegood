const mongoose = require('mongoose');

const formTemplateSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category ID is required']
    },
    subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        // Optional because it can be global for a category
    },
    name: { type: String, required: true },
    label: { type: String, required: true },
    type: { 
        type: String, 
        required: true,
        enum: ['text', 'textarea', 'number', 'email', 'mobile', 'select', 'multiselect', 'checkbox', 'radio', 'date', 'time', 'file', 'image', 'video', 'url']
    },
    placeholder: { type: String },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    order: { type: Number, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.FormTemplate || mongoose.model('FormTemplate', formTemplateSchema);
