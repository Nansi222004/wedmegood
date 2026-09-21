const PDFDocument = require('pdfkit');

/**
 * Generate a clean, branded PDF for a Quotation using PDFKit
 * @param {Object} quote - Populated quote document
 * @param {Object} lead - Populated lead document (or quote.leadId)
 * @param {Object} vendor - Populated vendor document (or quote.vendorId)
 * @param {Object} customer - Populated user document (or quote.userId)
 * @param {Stream} writeStream - Writable stream (e.g. Express res)
 */
function generateQuotePdf(params = {}) {
    const quote = params.quote || params;
    const lead = params.lead || quote.lead || {};
    const vendor = params.vendor || quote.vendor || quote.vendorId || {};
    const customer = params.customer || quote.customer || quote.userId || {};
    const writeStream = params.writeStream || null;

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40,
                bufferPages: true
            });

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });
            doc.on('error', reject);

            if (writeStream) {
                doc.pipe(writeStream);
            }

            // Palette
            const primaryColor = '#E91E63'; // Utsavo rose
            const darkText = '#1E293B';
            const lightText = '#64748B';
            const tableBg = '#F8FAFC';
            const borderCol = '#E2E8F0';

            // --- HEADER ---
            doc.rect(40, 40, 515, 6).fill(primaryColor);

            doc.moveDown(1.2);
            doc.fontSize(22).fillColor(primaryColor).font('Helvetica-Bold').text('UTSAVO', 40, 55);
            doc.fontSize(9).fillColor(lightText).font('Helvetica').text('Wedding Planning & Vendor Marketplace', 40, 80);

            // Quotation Badge / Meta (Top Right)
            const quoteNum = quote.quotationNumber || `QT-${quote._id.toString().slice(-6).toUpperCase()}`;
            doc.fontSize(14).fillColor(darkText).font('Helvetica-Bold').text('OFFICIAL QUOTATION', 350, 55, { align: 'right' });
            doc.fontSize(10).fillColor(lightText).font('Helvetica').text(`Quote #: ${quoteNum}`, 350, 73, { align: 'right' });
            const createdDateStr = quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
            const validDateStr = quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '14 Days';
            doc.fontSize(8.5).fillColor(lightText).text(`Date: ${createdDateStr}  |  Valid Until: ${validDateStr}`, 350, 88, { align: 'right' });

            doc.moveTo(40, 108).lineTo(555, 108).strokeColor(borderCol).stroke();

            // --- PARTICIPANT DETAILS (2-COLUMN) ---
            const startY = 120;
            // Left: Prepared For (Customer)
            doc.fontSize(9).fillColor(primaryColor).font('Helvetica-Bold').text('PREPARED FOR (CLIENT)', 40, startY);
            const custName = customer?.name || customer?.fullName || lead?.customerName || 'Valued Customer';
            const eventDateStr = lead?.eventDate ? new Date(lead.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'To be confirmed';
            const eventLoc = lead?.eventLocation || customer?.city || 'Venue to be confirmed';
            const guestCount = lead?.guestCount ? `${lead.guestCount} Guests` : 'Not specified';
            const eventType = lead?.category || 'Wedding Service';

            doc.fontSize(10).fillColor(darkText).font('Helvetica-Bold').text(custName, 40, startY + 14);
            doc.fontSize(8.5).fillColor(lightText).font('Helvetica')
                .text(`Event Date: ${eventDateStr}`, 40, startY + 28)
                .text(`Location: ${eventLoc}`, 40, startY + 40)
                .text(`Category / Type: ${eventType}`, 40, startY + 52)
                .text(`Guest Count: ${guestCount}`, 40, startY + 64);

            // Right: Service Provider (Vendor)
            doc.fontSize(9).fillColor(primaryColor).font('Helvetica-Bold').text('SERVICE PROVIDER (VENDOR)', 320, startY);
            const vendorName = vendor?.businessName || vendor?.fullName || 'Verified Wedding Vendor';
            const vendorCity = vendor?.city || 'India';
            const vendorPhone = vendor?.phone || 'Available via platform';
            const vendorEmail = vendor?.email || 'N/A';

            doc.fontSize(10).fillColor(darkText).font('Helvetica-Bold').text(vendorName, 320, startY + 14);
            doc.fontSize(8.5).fillColor(lightText).font('Helvetica')
                .text(`City: ${vendorCity}`, 320, startY + 28)
                .text(`Contact: ${vendorPhone}`, 320, startY + 40)
                .text(`Email: ${vendorEmail}`, 320, startY + 52)
                .text(`Status: Verified Utsavo Partner`, 320, startY + 64);

            doc.moveTo(40, startY + 82).lineTo(555, startY + 82).strokeColor(borderCol).stroke();

            // --- ITEMIZED SERVICES TABLE ---
            let tableY = startY + 95;
            doc.rect(40, tableY, 515, 22).fill(tableBg);
            doc.fontSize(8.5).fillColor(darkText).font('Helvetica-Bold')
                .text('#', 48, tableY + 6)
                .text('SERVICE / ITEM DESCRIPTION', 75, tableY + 6)
                .text('UNIT PRICE', 340, tableY + 6, { width: 65, align: 'right' })
                .text('QTY', 420, tableY + 6, { width: 35, align: 'center' })
                .text('TOTAL (₹)', 465, tableY + 6, { width: 80, align: 'right' });

            tableY += 24;

            const items = Array.isArray(quote.items) && quote.items.length > 0 ? quote.items : [
                { service: lead?.category || 'Wedding Package', description: quote.notes || '', price: quote.totalAmount, quantity: 1, amount: quote.totalAmount }
            ];

            items.forEach((item, idx) => {
                // Page break check
                if (tableY > 670) {
                    doc.addPage();
                    tableY = 50;
                }

                const price = Number(item.price) || 0;
                const qty = Number(item.quantity) || 1;
                const rowAmount = Number(item.amount) || (price * qty);

                doc.fontSize(8.5).fillColor(darkText).font('Helvetica-Bold').text(String(idx + 1), 48, tableY + 4);
                doc.fontSize(8.5).fillColor(darkText).font('Helvetica-Bold').text(item.service || 'Service', 75, tableY + 4);
                
                let descOffset = 16;
                if (item.description && item.description.trim().length > 0) {
                    doc.fontSize(7.5).fillColor(lightText).font('Helvetica').text(item.description.trim(), 75, tableY + 16, { width: 255 });
                    descOffset = Math.max(16, doc.heightOfString(item.description, { width: 255 }) + 6);
                }

                doc.fontSize(8.5).fillColor(darkText).font('Helvetica')
                    .text(`₹${price.toLocaleString('en-IN')}`, 340, tableY + 4, { width: 65, align: 'right' })
                    .text(String(qty), 420, tableY + 4, { width: 35, align: 'center' })
                    .text(`₹${rowAmount.toLocaleString('en-IN')}`, 465, tableY + 4, { width: 80, align: 'right' });

                tableY += Math.max(26, descOffset + 8);
                doc.moveTo(40, tableY).lineTo(555, tableY).strokeColor('#F1F5F9').stroke();
                tableY += 4;
            });

            // --- TOTALS & FINANCIAL SUMMARY ---
            if (tableY > 620) {
                doc.addPage();
                tableY = 50;
            }

            tableY += 10;
            const summaryX = 330;
            const summaryWidth = 225;

            const subtotal = Number(quote.subtotal) || items.reduce((s, it) => s + (Number(it.amount) || (Number(it.price) * Number(it.quantity))), 0);
            const discount = Number(quote.discountAmount) || 0;
            const tax = Number(quote.taxAmount) || 0;
            const total = Number(quote.totalAmount) || Math.max(0, subtotal + tax - discount);
            const advance = Number(quote.advancePaymentAmount) || 0;
            const remainingBalance = Math.max(0, total - advance);

            // Compute summary lines count for exact dynamic box sizing
            let summaryRows = 2; // subtotal + total
            if (discount > 0) summaryRows++;
            if (tax > 0 || quote.taxRatePercent > 0) summaryRows++;
            if (advance > 0) summaryRows += 2; // advance + remaining balance
            const boxHeight = Math.max(120, summaryRows * 20 + 26);

            doc.rect(summaryX, tableY, summaryWidth, boxHeight).fill('#FAFAFA').strokeColor(borderCol).stroke();
            let sumY = tableY + 8;

            doc.fontSize(8.5).fillColor(lightText).font('Helvetica').text('Subtotal:', summaryX + 12, sumY);
            doc.fillColor(darkText).text(`₹${subtotal.toLocaleString('en-IN')}`, summaryX + 100, sumY, { width: 110, align: 'right' });

            if (discount > 0) {
                sumY += 16;
                doc.fillColor('#10B981').text(`Discount (${quote.discountPercent ? `${quote.discountPercent}%` : 'Applied'}):`, summaryX + 12, sumY);
                doc.text(`-₹${discount.toLocaleString('en-IN')}`, summaryX + 100, sumY, { width: 110, align: 'right' });
            }

            if (tax > 0 || quote.taxRatePercent > 0) {
                sumY += 16;
                const taxLabel = quote.taxRatePercent ? `GST / Taxes (${quote.taxRatePercent}%):` : 'GST / Taxes:';
                doc.fillColor(lightText).text(taxLabel, summaryX + 12, sumY);
                doc.fillColor(darkText).text(`+₹${tax.toLocaleString('en-IN')}`, summaryX + 100, sumY, { width: 110, align: 'right' });
            }

            sumY += 18;
            doc.moveTo(summaryX + 10, sumY).lineTo(summaryX + summaryWidth - 10, sumY).strokeColor(primaryColor).stroke();
            sumY += 6;

            doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold').text('FINAL TOTAL:', summaryX + 12, sumY);
            doc.text(`₹${total.toLocaleString('en-IN')}`, summaryX + 90, sumY, { width: 120, align: 'right' });

            if (advance > 0) {
                sumY += 18;
                doc.fontSize(8).fillColor('#D97706').font('Helvetica-Bold').text(`Advance Required (${quote.advancePaymentPercent ? `${quote.advancePaymentPercent}%` : 'Booking'}):`, summaryX + 12, sumY);
                doc.text(`₹${advance.toLocaleString('en-IN')}`, summaryX + 100, sumY, { width: 110, align: 'right' });

                sumY += 15;
                doc.fontSize(8).fillColor('#475569').font('Helvetica-Bold').text('Remaining Balance:', summaryX + 12, sumY);
                doc.text(`₹${remainingBalance.toLocaleString('en-IN')}`, summaryX + 100, sumY, { width: 110, align: 'right' });
            }

            // --- TERMS & CONDITIONS & MILESTONES (Left Side) ---
            doc.fontSize(9).fillColor(primaryColor).font('Helvetica-Bold').text('TERMS & PAYMENT CONDITIONS', 40, tableY + 5);
            let termsText = quote.terms || 'Advance booking required to lock calendar dates. Remaining balance payable per agreed milestones.';
            if (quote.cancellationTerms) {
                termsText += `\n\nCancellation Policy: ${quote.cancellationTerms}`;
            }
            if (quote.notes) {
                termsText += `\n\nSpecial Notes: ${quote.notes}`;
            }

            // Append Payment Milestones schedule if present
            if (Array.isArray(quote.milestonePaymentTerms) && quote.milestonePaymentTerms.length > 0) {
                termsText += '\n\nPayment Milestone Schedule:';
                quote.milestonePaymentTerms.forEach((m, mIdx) => {
                    const mName = m.milestone || `Milestone ${mIdx + 1}`;
                    const mPct = m.percentage ? `${m.percentage}%` : '';
                    const mAmt = m.amount ? `₹${Number(m.amount).toLocaleString('en-IN')}` : '';
                    const mDue = m.dueDescription ? `(${m.dueDescription})` : '';
                    termsText += `\n• ${mName} ${mPct} ${mAmt} ${mDue}`.trim();
                });
            }

            // Check if terms text exceeds page height
            const termsHeight = doc.heightOfString(termsText, { width: 270 });
            if (tableY + 20 + termsHeight > 780) {
                doc.addPage();
                doc.fontSize(9).fillColor(primaryColor).font('Helvetica-Bold').text('TERMS & CONDITIONS (CONTINUED)', 40, 50);
                doc.fontSize(8).fillColor(lightText).font('Helvetica').text(termsText, 40, 70, { width: 515 });
            } else {
                doc.fontSize(8).fillColor(lightText).font('Helvetica').text(termsText, 40, tableY + 20, { width: 270 });
            }

            // --- PAGE NUMBERING ---
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).fillColor(lightText).font('Helvetica')
                    .text(`Utsavo Digital Wedding Platform  |  Official Quote #${quoteNum}`, 40, 800)
                    .text(`Page ${i + 1} of ${pages.count}`, 450, 800, { width: 105, align: 'right' });
            }

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = {
    generateQuotePdf
};
