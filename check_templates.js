const mongoose = require('mongoose');
const FormTemplate = require('./Backend/modules/admin/FormTemplate');
require('dotenv').config({ path: './Backend/.env' });

async function checkTemplates() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wedmegood');
  const templates = await FormTemplate.find({}).populate('categoryId subCategoryId');
  console.log(JSON.stringify(templates, null, 2));
  process.exit();
}
checkTemplates();
