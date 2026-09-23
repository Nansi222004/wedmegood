const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/utsavo-chakra';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    
    const EInvite = require('../modules/user/EInvite');
    const Guest = require('../modules/user/Guest');
    const User = require('../modules/user/user.model');

    const invite = await EInvite.findOne({ slug: 'd74e2d2f0e3f4fb7af8d0709' });
    if (!invite) {
      console.log('Invite d74e2d2f0e3f4fb7af8d0709 not found');
      const allInvites = await EInvite.find({});
      console.log('All invites in DB:', allInvites.map(i => ({ id: i._id, slug: i.slug, name: i.name, userId: i.userId, rsvps: i.rsvps.length })));
      process.exit(0);
    }

    console.log('Found Invite:', {
      id: invite._id,
      name: invite.name,
      userId: invite.userId,
      rsvpsCount: invite.rsvps.length,
      rsvps: invite.rsvps
    });

    const owner = await User.findById(invite.userId);
    console.log('Owner of this invite:', owner ? { id: owner._id, email: owner.email, name: owner.name } : 'None');

    // Sync all rsvps in all invites to Guest model
    const invites = await EInvite.find({});
    for (const inv of invites) {
      for (const r of inv.rsvps) {
        const query = { userId: inv.userId };
        const clauses = [];
        if (r.phone) clauses.push({ phone: r.phone });
        if (r.email) clauses.push({ email: r.email });
        if (r.guestName) clauses.push({ name: r.guestName });
        if (clauses.length > 0) query.$or = clauses;

        let g = await Guest.findOne(query);
        const statusMap = r.status === 'Attending' ? 'Confirmed' : (r.status === 'Not Attending' ? 'Declined' : 'Pending');
        if (!g) {
          g = await Guest.create({
            userId: inv.userId,
            name: r.guestName || 'Guest',
            phone: r.phone || '',
            email: r.email || '',
            category: 'Others',
            side: 'Mutual',
            guestCount: r.guestCount || 1,
            rsvpStatus: statusMap,
            mealPreference: 'No Preference',
            invitationSent: true,
            notes: r.notes ? `RSVP from E-Invite: ${r.notes}` : 'RSVP from E-Invite'
          });
          console.log(`Created guest for ${inv.userId}:`, g.name, g.rsvpStatus);
        } else {
          g.rsvpStatus = statusMap;
          g.guestCount = r.guestCount || g.guestCount;
          await g.save();
          console.log(`Updated existing guest for ${inv.userId}:`, g.name, g.rsvpStatus);
        }
      }
    }

    const allGuests = await Guest.find({});
    console.log('Total guests in DB now:', allGuests.length);
    allGuests.forEach(g => console.log(' - Guest:', g.name, g.phone, g.rsvpStatus, 'userId:', g.userId));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
