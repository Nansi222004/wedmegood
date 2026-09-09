const mongoose = require('mongoose');
const FormTemplate = require('./modules/admin/FormTemplate');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const count = await FormTemplate.countDocuments();
    const all = await FormTemplate.find().lean();
    console.log(`Total Templates: ${count}`);
    if(count > 0) {
      console.log('Sample Template:', JSON.stringify(all[0], null, 2));
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
