const mongoose = require('mongoose');

/**
 * Safely migrate legacy Conversation documents:
 * 1. Backfill top-level userId and vendorId from participants if missing.
 * 2. Detect and merge duplicates for identical (userId, vendorId) pairs, preserving all messages.
 * 3. Sync unread counts and index safety.
 */
async function migrateConversations() {
    try {
        const Conversation = mongoose.model('Conversation');
        const Message = mongoose.model('Message');

        const allConversations = await Conversation.find({}).sort({ updatedAt: -1 });
        if (!allConversations || allConversations.length === 0) {
            return { migratedCount: 0, mergedCount: 0 };
        }

        let migratedCount = 0;
        let mergedCount = 0;

        // Step 1: Backfill userId and vendorId from participants array if missing
        for (const conv of allConversations) {
            let modified = false;

            if ((!conv.userId || !conv.vendorId) && Array.isArray(conv.participants)) {
                for (const p of conv.participants) {
                    if (p.participantModel === 'User' && !conv.userId) {
                        conv.userId = p.participantId;
                        modified = true;
                    } else if (p.participantModel === 'Vendor' && !conv.vendorId) {
                        conv.vendorId = p.participantId;
                        modified = true;
                    }
                }
            }

            if (conv.userUnreadCount === undefined) {
                conv.userUnreadCount = 0;
                modified = true;
            }
            if (conv.vendorUnreadCount === undefined) {
                conv.vendorUnreadCount = 0;
                modified = true;
            }
            if (!conv.status) {
                conv.status = 'Active';
                modified = true;
            }

            if (modified) {
                await conv.save();
                migratedCount++;
            }
        }

        // Step 2: Detect and merge duplicate (userId, vendorId) pairs
        const pairMap = new Map();
        const refreshedConversations = await Conversation.find({}).sort({ updatedAt: -1 });

        for (const conv of refreshedConversations) {
            if (!conv.userId || !conv.vendorId) continue;
            const key = `${conv.userId.toString()}_${conv.vendorId.toString()}`;

            if (!pairMap.has(key)) {
                pairMap.set(key, conv);
            } else {
                // Duplicate found! Retain pairMap.get(key) (the newer one) and merge
                const retained = pairMap.get(key);
                const duplicate = conv;

                // Repoint any messages from duplicate to retained conversation
                await Message.updateMany(
                    { conversationId: duplicate._id },
                    { $set: { conversationId: retained._id } }
                );

                // Merge leadHistory if present
                if (duplicate.leadId && (!retained.leadId || retained.leadId.toString() !== duplicate.leadId.toString())) {
                    retained.leadHistory = retained.leadHistory || [];
                    retained.leadHistory.push({
                        leadId: duplicate.leadId,
                        linkedAt: duplicate.createdAt || new Date()
                    });
                    if (!retained.leadId) {
                        retained.leadId = duplicate.leadId;
                    }
                }

                // Merge bookingId if present
                if (!retained.bookingId && duplicate.bookingId) {
                    retained.bookingId = duplicate.bookingId;
                }

                await retained.save();
                await Conversation.findByIdAndDelete(duplicate._id);
                mergedCount++;
            }
        }

        // Step 3: Ensure compound unique index
        try {
            await Conversation.collection.createIndex({ userId: 1, vendorId: 1 }, { unique: true, background: true });
        } catch (idxErr) {
            console.warn('chat.migration: createIndex notice:', idxErr.message);
        }

        // Step 4: Ensure Message clientMessageId unique index with partialFilterExpression
        try {
            await Message.collection.dropIndex('conversationId_1_senderId_1_clientMessageId_1');
        } catch (e) {
            // Index may not exist or already dropped
        }
        try {
            await Message.collection.createIndex(
                { conversationId: 1, senderId: 1, clientMessageId: 1 },
                { unique: true, partialFilterExpression: { clientMessageId: { $type: 'string' } }, background: true }
            );
        } catch (msgIdxErr) {
            console.warn('chat.migration: message createIndex notice:', msgIdxErr.message);
        }

        console.log(`✅ chat.migration completed: ${migratedCount} backfilled, ${mergedCount} duplicates merged.`);
        return { migratedCount, mergedCount };
    } catch (err) {
        console.error('❌ chat.migration error:', err.message);
        return { error: err.message };
    }
}

module.exports = { migrateConversations };
