const express = require('express');
const { protect } = require('../user/auth.middleware');
const { protectOps, allow } = require('../operations/opsAuth');
const worker = require('./worker.controller');
const jobs = require('./jobs.controller');
const support = require('./support.controller');

// Temporary workforce: workers use their customer account; vendors post through event operations;
// customers can post home jobs too.
const router = express.Router();

// Public
router.get('/options', worker.options);
router.get('/safety-kinds', (req, res) => res.status(200).json({ success: true, data: support.KINDS }));
router.get('/digilocker/callback', worker.digilockerCallback);

// Vendor (owner / supervisor) jobs
const vendor = express.Router();
vendor.use(protectOps, allow('tasks.manage'), jobs.vendorPoster);
// Customer home jobs
const customer = express.Router();
customer.use(protect, jobs.customerPoster);

for (const r of [vendor, customer]) {
    r.get('/jobs', jobs.listJobs);
    r.post('/jobs', jobs.createJob);
    r.get('/jobs/:id', jobs.getJob);
    r.put('/jobs/:id', jobs.updateJob);
    r.post('/jobs/:id/cancel', jobs.cancelJob);
    r.post('/jobs/:id/assignments/:aid/checkin', jobs.markCheckIn);
    r.post('/jobs/:id/assignments/:aid/approve', jobs.approveShift);
    r.post('/jobs/:id/assignments/:aid/pay', jobs.recordPayment);
    r.post('/jobs/:id/assignments/:aid/noshow', jobs.markNoShow);
    r.post('/jobs/:id/assignments/:aid/rate', jobs.rateWorker);
    r.get('/jobs/:id/assignments/:aid/messages', support.posterMessages);
    r.post('/jobs/:id/assignments/:aid/messages', support.posterSend);
    r.post('/jobs/:id/safety', support.posterSafety);
}
router.use('/vendor', vendor);
router.use('/customer', customer);

// Worker (customer account)
const me = express.Router();
me.use(protect);
me.get('/me', worker.getMe);
me.put('/me', worker.saveMe);
me.put('/me/availability', worker.setAvailability);
me.post('/me/digilocker', worker.startDigilocker);
me.post('/me/verification', worker.submitManualVerification);
me.get('/demand', worker.demand);
me.get('/offers/active', worker.activeOffers);
me.post('/offers/:offerId/accept', worker.acceptOffer);
me.post('/offers/:offerId/decline', worker.declineOffer);
me.get('/assignments', worker.myAssignments);
me.post('/assignments/:aid/checkin', worker.checkIn);
me.post('/assignments/:aid/checkout', worker.checkOut);
me.post('/assignments/:aid/confirm-payment', worker.confirmPayment);
me.post('/assignments/:aid/dispute', worker.raiseDispute);
me.post('/assignments/:aid/cancel', worker.cancelAssignment);
me.get('/assignments/:aid/messages', support.workerMessages);
me.post('/assignments/:aid/messages', support.workerSend);
me.post('/assignments/:aid/safety', support.workerSafety);
router.use('/', me);

module.exports = router;
