const mongoose = require('mongoose');

// Statuses a dispatched (system-assigned) lead moves through. Direct leads start at 'New'.
const LEAD_STATUSES = [
    'New',               // direct enquiry to a vendor the customer picked
    'Awaiting Response', // offered to a vendor, waiting for accept/decline (the buzzer)
    'Accepted',          // vendor accepted the offer and must contact the customer before contactDeadline
    'Contacted',
    'Quote Sent',
    'Booked',
    'Rejected',
    'Details Requested', // vendor asked the customer for more event details
    'Exploring',         // customer is choosing a vendor from the eligible list
    'Unassigned',        // no eligible vendor accepted; admin and customer are told
    'Closed',            // ended without a booking (event date passed)
    'Cancelled'          // customer withdrew this service
];

const leadSchema = new mongoose.Schema({
    // Empty while a dispatched lead is being offered; set once a vendor accepts or is chosen
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // User might not be logged in or lead might be from a guest inquiry
    },
    // The event enquiry this service lead belongs to (one enquiry -> one lead per service)
    enquiryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enquiry',
        default: null,
        index: true
    },
    customerName: {
        type: String,
        required: [true, 'Please provide customer name']
    },
    phone: {
        type: String,
        required: [true, 'Please provide phone number']
    },
    eventType: {
        type: String,
        default: 'Wedding'
    },
    eventDate: {
        type: Date,
        required: [true, 'Please provide event date']
    },
    eventLocation: {
        type: String,
        required: [true, 'Please provide event location']
    },
    pincode: { type: String, default: '' },
    city: { type: String, default: '' },
    district: { type: String, default: '' },
    location: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },
    message: {
        type: String,
        required: [true, 'Please provide inquiry message']
    },
    category: {
        type: String
    },
    guestCount: {
        type: Number,
        default: 0
    },
    // Budget for this service
    budget: {
        type: Number,
        default: 0
    },
    requirements: {
        type: String
    },
    venueType: {
        type: String,
        enum: ['Outdoor', 'Indoor', 'Both', 'Not Specified'],
        default: 'Not Specified'
    },
    // Legacy public image links (older enquiries)
    referencePhotos: [{
        type: String
    }],
    // Private reference photos: streamed only to the customer and the assigned vendor
    referencePhotoIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReferencePhoto'
    }],
    // Direct: customer picked the vendor. RoundRobin: legacy category assignment.
    // System: offered and accepted through the dispatch queue. CustomerSelected: picked from
    // "Explore other vendors". Manual: assigned by an admin.
    assignedType: {
        type: String,
        enum: ['Direct', 'RoundRobin', 'System', 'CustomerSelected', 'Manual'],
        default: 'Direct'
    },
    status: {
        type: String,
        enum: LEAD_STATUSES,
        default: 'New'
    },
    isImportant: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        default: ''
    },

    // Dispatch state for system-assigned leads
    dispatch: {
        currentOfferId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeadOffer', default: null },
        // 1 = vendor's own service area, 2 = district / travel range, 3 = anywhere (customer agreed)
        stage: { type: Number, default: 1 },
        allowExpandedSearch: { type: Boolean, default: false },
        attempts: { type: Number, default: 0 },
        acceptedAt: { type: Date, default: null },
        contactDeadline: { type: Date, default: null },
        firstContactAt: { type: Date, default: null },
        unassignedAt: { type: Date, default: null },
        detailsRequest: {
            vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
            note: { type: String, default: '' },
            requestedAt: { type: Date, default: null },
            resolvedAt: { type: Date, default: null }
        }
    },
    // Vendors the customer turned down for this lead; never offered this lead again
    customerDeclines: [{
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
        reason: { type: String, default: 'skipped' },
        note: { type: String, default: '' },
        at: { type: Date, default: Date.now }
    }],
    customerSelectedVendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        default: null
    },
    // Audit trail of status changes
    statusHistory: [{
        status: String,
        note: { type: String, default: '' },
        by: { type: String, default: 'system' },
        at: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

leadSchema.index({ vendorId: 1, createdAt: -1 });
leadSchema.index({ userId: 1, createdAt: -1 });
leadSchema.index({ status: 1, 'dispatch.contactDeadline': 1 });
leadSchema.index({ userId: 1, category: 1, eventDate: 1 });

leadSchema.statics.STATUSES = LEAD_STATUSES;

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
