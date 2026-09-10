const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category ID is required']
    },
    name: {
        type: String,
        required: [true, 'Subcategory name is required'],
        trim: true
    },
    status: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.SubCategory || mongoose.model('SubCategory', subCategorySchema);
