const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Category = require('../modules/admin/Category');
const SubCategory = require('../modules/admin/SubCategory');
const FormTemplate = require('../modules/admin/FormTemplate');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data to ensure master sync
        await Category.deleteMany({});
        await SubCategory.deleteMany({});
        await FormTemplate.deleteMany({});
        console.log('Cleared existing Categories, SubCategories, and FormTemplates');

        // Read parsed data
        const parsedDataPath = 'C:\\\\Users\\\\amanj\\\\.gemini\\\\antigravity-ide\\\\brain\\\\625ded19-c3fe-4221-a920-364d87029d0f\\\\scratch\\\\parsed_categories.json';
        
        let rawData;
        try {
             rawData = fs.readFileSync(parsedDataPath, 'utf8');
        } catch(e) {
             console.error("Could not find parsed_categories.json, make sure the python parser script ran successfully.");
             process.exit(1);
        }
        
        const categoriesData = JSON.parse(rawData);

        for (const catData of categoriesData) {
            // 1. Create Category
            const newCat = new Category({
                name: catData.name,
                isActive: true
            });
            await newCat.save();
            console.log(`Created Category: ${newCat.name}`);

            for (const subCatData of catData.subcategories) {
                // 2. Create SubCategory
                const newSubCat = new SubCategory({
                    categoryId: newCat._id,
                    name: subCatData.name,
                    status: true
                });
                await newSubCat.save();
                console.log(`  - Created SubCategory: ${newSubCat.name}`);

                // 3. Create FormTemplate
                if (subCatData.fields && subCatData.fields.length > 0) {
                    const newFormTemplate = new FormTemplate({
                        categoryId: newCat._id,
                        subCategoryId: newSubCat._id,
                        fields: subCatData.fields
                    });
                    await newFormTemplate.save();
                    console.log(`    - Created FormTemplate for ${newSubCat.name} with ${subCatData.fields.length} fields`);
                }
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
};

seedData();
