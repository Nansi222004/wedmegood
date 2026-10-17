const express = require('express');
const { protectOps, allow, ownerOnly } = require('./opsAuth');
const events = require('./events.controller');
const stock = require('./stock.controller');
const finance = require('./finance.controller');
const team = require('./team.controller');

// Event operations: used by the vendor owner and by their team members (each with their own login)
const router = express.Router();

router.post('/team/login', team.teamLogin);

router.use(protectOps);

router.get('/me', team.me);
router.put('/me/password', team.changeMyPassword);
router.get('/me/wallet', team.getWallet);

// Events and the readiness board
router.get('/events', events.listEvents);
router.get('/events/board', allow('events.view'), events.getBoard);
router.get('/events/:id', events.getEvent);
router.put('/events/:id', allow('tasks.manage'), events.updateEvent);
router.post('/events/:id/generate-checklist', allow('tasks.manage'), events.generateChecklist);
router.post('/events/:id/copy-plan', allow('tasks.manage'), events.copyPlan);
router.post('/events/:id/confirm-ready', allow('tasks.verify'), events.confirmReady);
router.post('/events/:id/change-requests', ownerOnly, events.createChangeRequest);
router.post('/change-requests/:crId/withdraw', ownerOnly, events.withdrawChangeRequest);
// Customer updates: owner sends their own, and approves or discards held ones
router.post('/events/:id/customer-updates', ownerOnly, events.sendCustomerUpdate);
router.post('/events/:id/customer-updates/:uid', ownerOnly, events.decideCustomerUpdate);
router.get('/settings', ownerOnly, events.getSettings);
router.put('/settings', ownerOnly, events.updateSettings);

// Tasks
// Owner's dashboard brief (today, tomorrow, leads, money, risks)
router.get('/brief', ownerOnly, require('./brief.controller').getBrief);

router.get('/my/tasks', events.myTasks);
router.post('/events/:id/tasks', allow('tasks.manage'), events.createTask);
router.put('/tasks/:taskId', allow('tasks.manage'), events.updateTask);
router.delete('/tasks/:taskId', allow('tasks.manage'), events.deleteTask);
router.post('/tasks/:taskId/status', events.setTaskStatus);

// Stock, reservations, gate passes, shortages
router.get('/stock', allow('stock.view'), stock.listStock);
router.post('/stock', allow('stock.manage'), stock.createStockItem);
router.post('/stock/assign-codes', allow('stock.manage'), stock.assignItemCodes);
router.put('/stock/:itemId', allow('stock.manage'), stock.updateStockItem);
router.post('/stock/:itemId/adjust', allow('stock.manage'), stock.adjustStock);
router.get('/stock/:itemId/movements', allow('stock.view'), stock.stockMovements);
router.post('/events/:id/reservations', allow('stock.manage', 'tasks.manage'), stock.reserveStock);
router.delete('/reservations/:rid', allow('stock.manage', 'tasks.manage'), stock.releaseReservation);
router.post('/events/:id/gatepasses', allow('gatepass.manage'), stock.createGatePass);
router.post('/gatepasses/:gid/pack', allow('gatepass.manage'), stock.packGatePass);
router.post('/gatepasses/:gid/dispatch', allow('gatepass.manage'), stock.dispatchGatePass);
router.post('/gatepasses/:gid/receive', allow('gatepass.receive', 'gatepass.manage'), stock.receiveGatePass);
router.post('/gatepasses/:gid/return', allow('gatepass.manage'), stock.returnGatePass);
router.get('/shortages', allow('stock.view'), stock.listShortages);
router.post('/shortages/:sid/resolve', ownerOnly, stock.resolveShortage);

// Purchases
router.get('/purchases', stock.listPurchases);
router.post('/purchases', allow('purchase.request'), stock.createPurchase);
router.post('/purchases/:pid/decide', ownerOnly, stock.decidePurchase);
router.post('/purchases/:pid/record', allow('purchase.record'), stock.recordPurchase);

// Money
router.get('/expenses', finance.listExpenses);
// Shared cost (driver, vehicle) split across events by hours or km
router.post('/expenses/split', allow('finance.view', 'expense.manage'), require('./cash.controller').splitExpense);
router.post('/expenses', finance.createExpense);
router.put('/expenses/:eid', allow('finance.view', 'expense.manage'), finance.updateExpense);
router.post('/expenses/:eid/approve', allow('finance.view', 'expense.manage'), finance.approveExpense);
router.delete('/expenses/:eid', allow('finance.view', 'expense.manage'), finance.deleteExpense);
router.get('/events/:id/pnl', allow('finance.view'), finance.eventPnl);
router.get('/events/:id/unsettled', allow('finance.view'), finance.getUnsettled);
router.post('/events/:id/close-accounts', allow('finance.view'), finance.closeAccounts);
router.get('/accounts', allow('finance.view'), finance.accountsSummary);
// Daily cash count and money in/out by payment method
router.get('/cash', allow('finance.view'), require('./cash.controller').getCashDay);
router.post('/cash/close', allow('finance.view'), require('./cash.controller').closeCashDay);

// Team, attendance, wallet
router.get('/team', allow('tasks.manage', 'finance.view'), team.listTeam);
router.post('/team', ownerOnly, team.addMember);
router.put('/team/:memberId', ownerOnly, team.updateMember);
router.get('/team/:memberId/wallet', allow('finance.view'), team.getWallet);
router.post('/team/:memberId/wallet', ownerOnly, team.addWalletEntry);
router.post('/events/:id/attendance', team.recordAttendance);
router.post('/shifts/:sid/confirm', allow('attendance.manage'), team.confirmShift);

// Sub-vendor packages
router.get('/my/packages', allow('packages.own'), team.myPackages);
router.post('/events/:id/packages', ownerOnly, team.createPackage);
router.post('/packages/:pid/respond', allow('packages.own'), team.respondPackage);
router.post('/packages/:pid/progress', allow('packages.own'), team.packageProgress);
router.post('/packages/:pid/approve', ownerOnly, team.approvePackage);
router.post('/packages/:pid/settle', ownerOnly, team.settlePackage);
router.post('/packages/:pid/reassign', ownerOnly, team.reassignPackage);

module.exports = router;
