const adminRoutes = require('./Backend/modules/admin');
console.log('Admin Routes:', adminRoutes.stack ? adminRoutes.stack.map(r => r.route ? r.route.path : 'middleware') : 'Not a router');


