const mongoose = require('mongoose');
const FormTemplate = require('./modules/admin/FormTemplate');
require('dotenv').config();

async function checkTemplates() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wedmegood');
  const templates = await FormTemplate.find({}).populate('categoryId subCategoryId');
  console.log(JSON.stringify(templates, null, 2));
  process.exit();
}
checkTemplates();
