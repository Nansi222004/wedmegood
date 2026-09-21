/**
 * Utsavo Authoritative Quotation Pricing Engine
 * Enforces strict calculation order, precision rounding, and parameter precedence.
 */

function calculateQuotePricing(payload = {}) {
    const rawItems = Array.isArray(payload.items) ? payload.items : [];
    
    if (rawItems.length === 0) {
        throw new Error('Quote must include at least one service item');
    }

    const items = rawItems.map((item, idx) => {
        const service = String(item.service || `Item ${idx + 1}`).trim();
        const description = String(item.description || '').trim();
        const price = Math.max(0, Number(item.price) || 0);
        const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
        const amount = Math.round(price * quantity * 100) / 100;
        return {
            service,
            description,
            price,
            quantity,
            amount
        };
    });

    const subtotal = Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;

    // Discount calculation (precedence: discountPercent if > 0, else discountAmount)
    let discountPercent = Number(payload.discountPercent);
    let discountAmount = Number(payload.discountAmount);

    let calculatedDiscount = 0;
    if (!isNaN(discountPercent) && discountPercent > 0) {
        discountPercent = Math.min(100, Math.max(0, discountPercent));
        calculatedDiscount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
    } else if (!isNaN(discountAmount) && discountAmount > 0) {
        calculatedDiscount = Math.min(subtotal, Math.max(0, Math.round(discountAmount * 100) / 100));
        discountPercent = subtotal > 0 ? Math.round((calculatedDiscount / subtotal) * 10000) / 100 : 0;
    } else {
        discountPercent = 0;
        calculatedDiscount = 0;
    }

    const taxableAmount = Math.max(0, Math.round((subtotal - calculatedDiscount) * 100) / 100);

    // Tax calculation (precedence: taxRatePercent if defined and >= 0, else taxAmount)
    let taxRatePercent = payload.taxRatePercent !== undefined && payload.taxRatePercent !== null
        ? Number(payload.taxRatePercent)
        : null;
    let taxAmount = payload.taxAmount !== undefined && payload.taxAmount !== null
        ? Number(payload.taxAmount)
        : null;

    let calculatedTax = 0;
    if (taxRatePercent !== null && !isNaN(taxRatePercent) && taxRatePercent >= 0) {
        taxRatePercent = Math.max(0, taxRatePercent);
        calculatedTax = Math.round(taxableAmount * (taxRatePercent / 100) * 100) / 100;
    } else if (taxAmount !== null && !isNaN(taxAmount) && taxAmount >= 0) {
        calculatedTax = Math.max(0, Math.round(taxAmount * 100) / 100);
        taxRatePercent = taxableAmount > 0 ? Math.round((calculatedTax / taxableAmount) * 10000) / 100 : 0;
    } else {
        taxRatePercent = 0;
        calculatedTax = 0;
    }

    const totalAmount = Math.round((taxableAmount + calculatedTax) * 100) / 100;

    // Advance payment calculation (precedence: advancePaymentPercent if > 0, else advancePaymentAmount)
    let advancePaymentPercent = Number(payload.advancePaymentPercent);
    let advancePaymentAmount = Number(payload.advancePaymentAmount);

    let calculatedAdvance = 0;
    if (!isNaN(advancePaymentPercent) && advancePaymentPercent > 0) {
        advancePaymentPercent = Math.min(100, Math.max(0, advancePaymentPercent));
        calculatedAdvance = Math.round(totalAmount * (advancePaymentPercent / 100) * 100) / 100;
    } else if (!isNaN(advancePaymentAmount) && advancePaymentAmount > 0) {
        calculatedAdvance = Math.min(totalAmount, Math.max(0, Math.round(advancePaymentAmount * 100) / 100));
        advancePaymentPercent = totalAmount > 0 ? Math.round((calculatedAdvance / totalAmount) * 10000) / 100 : 0;
    } else {
        advancePaymentPercent = 0;
        calculatedAdvance = 0;
    }

    // Milestones
    const rawMilestones = Array.isArray(payload.milestonePaymentTerms) ? payload.milestonePaymentTerms : [];
    const milestonePaymentTerms = rawMilestones.map(m => {
        const milestone = String(m.milestone || '').trim();
        const percentage = Math.max(0, Math.min(100, Number(m.percentage) || 0));
        const amount = Math.round(totalAmount * (percentage / 100) * 100) / 100;
        const dueDescription = String(m.dueDescription || m.description || '').trim();
        return {
            milestone,
            percentage,
            amount,
            dueDescription
        };
    });

    return {
        items,
        subtotal,
        discountPercent,
        discountAmount: calculatedDiscount,
        taxableAmount,
        taxRatePercent: taxRatePercent || 0,
        taxAmount: calculatedTax,
        totalAmount,
        advancePaymentPercent,
        advancePaymentAmount: calculatedAdvance,
        milestonePaymentTerms,
        notes: String(payload.notes || '').trim(),
        terms: String(payload.terms || '').trim(),
        cancellationTerms: String(payload.cancellationTerms || '').trim()
    };
}

module.exports = {
    calculateQuotePricing
};
