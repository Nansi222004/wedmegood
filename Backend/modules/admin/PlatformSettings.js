const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
    // Configurable platform commission percent (0 - 100).
    // If null/undefined, falls back to process.env.PLATFORM_COMMISSION_PERCENTAGE.
    platformCommissionPercent: {
        type: Number,
        default: null,
        min: [0, 'Commission percentage cannot be negative'],
        max: [100, 'Commission percentage cannot exceed 100']
    },
    // Service GST percent if configured (0 - 100).
    // Stored as nullable/unconfigured per canonical requirements.
    serviceGstPercent: {
        type: Number,
        default: null,
        min: [0, 'GST percentage cannot be negative'],
        max: [100, 'GST percentage cannot exceed 100']
    },
    // Minimum vendor payout withdrawal amount (>= 0).
    // Stored as nullable/unconfigured unless explicitly set by Admin.
    minWithdrawalAmount: {
        type: Number,
        default: null,
        min: [0, 'Minimum withdrawal amount cannot be negative']
    },
    // Platform operational state flags
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    autoPayouts: {
        type: Boolean,
        default: false
    },
    // When false, vendor ratings are hidden across the apps and reviews can be left without stars
    ratingsEnabled: {
        type: Boolean,
        default: true
    },
    // Booking cancellation policy: a booking cancelled with fewer days' notice than this
    // before the event makes the full amount payable to the vendor
    cancellationNoticeDays: {
        type: Number,
        default: 15,
        min: [0, 'Cancellation notice days cannot be negative']
    },
    // Fake vendors page: free views per user, then paid access for a number of days
    fakeVendorFreeViews: {
        type: Number,
        default: 1,
        min: [0, 'Free views cannot be negative']
    },
    fakeVendorAccessPrice: {
        type: Number,
        default: 99,
        min: [1, 'Access price must be at least 1']
    },
    fakeVendorAccessDays: {
        type: Number,
        default: 30,
        min: [1, 'Access duration must be at least 1 day']
    },
    // Lead dispatch: how long a vendor has to accept an offer once it reaches the device,
    // how long an undelivered offer waits, and how long an accepting vendor has to contact the customer
    leadOfferWindowSeconds: { type: Number, default: 30, min: [10, 'Offer window must be at least 10 seconds'] },
    leadOfferDeliveryGraceSeconds: { type: Number, default: 60, min: [0, 'Delivery grace cannot be negative'] },
    leadContactDeadlineHours: { type: Number, default: 1, min: [1, 'Contact deadline must be at least 1 hour'] },
    // Times the customer can ask for another vendor before choosing one themselves
    leadCustomerReassignLimit: { type: Number, default: 2, min: [0, 'Reassign limit cannot be negative'] },
    // Hours a customer has to add details a vendor asked for before the lead moves on
    leadDetailsRequestHours: { type: Number, default: 24, min: [1, 'Details request window must be at least 1 hour'] },
    // Enquiries one customer can post in 24 hours (spam / fake enquiry control)
    enquiryDailyLimit: { type: Number, default: 5, min: [1, 'Daily enquiry limit must be at least 1'] },
    // Complaint turnaround targets
    complaintAckHours: { type: Number, default: 24, min: [1, 'Must be at least 1 hour'] },
    complaintVendorResponseHours: { type: Number, default: 48, min: [1, 'Must be at least 1 hour'] },
    complaintResolveDays: { type: Number, default: 7, min: [1, 'Must be at least 1 day'] },
    complaintSafetyResolveDays: { type: Number, default: 2, min: [1, 'Must be at least 1 day'] },
    // Audit metadata
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.PlatformSettings || mongoose.model('PlatformSettings', platformSettingsSchema);
