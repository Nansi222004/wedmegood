const mongoose = require('mongoose');
const crypto = require('crypto');
const FamilyGroup = require('./FamilyGroup');
const FamilyGroupMessage = require('./FamilyGroupMessage');
const User = require('./user.model');
const ChecklistTask = require('./ChecklistTask');
const TimelineEvent = require('./TimelineEvent');
const Budget = require('./Budget');
const Guest = require('./Guest');
const Inspiration = require('./Inspiration');

// Country-code-aware phone normalization (E.164 compatible)
const normalizePhone = (phone) => {
  if (!phone) return '';
  let cleaned = String(phone).trim().replace(/[\s\-\(\)\.]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  // Indian 10-digit number without country code (default marketplace locale)
  if (/^\d{10}$/.test(cleaned)) {
    return '+91' + cleaned;
  }
  // 11 digits starting with trunk '0'
  if (/^0\d{10}$/.test(cleaned)) {
    return '+91' + cleaned.slice(1);
  }
  // 12 digits starting with '91'
  if (/^91\d{10}$/.test(cleaned)) {
    return '+' + cleaned;
  }
  return cleaned;
};

const generateInviteToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
};

const hashInviteToken = (rawToken) => {
  if (!rawToken) return '';
  return crypto.createHash('sha256').update(String(rawToken).trim()).digest('hex');
};

// In-memory idempotency cache (short-lived 10-second deduplication)
const recentCreations = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of recentCreations.entries()) {
    if (now - item.timestamp > 10000) {
      recentCreations.delete(key);
    }
  }
}, 30000).unref();

// @desc    Get user's family groups (owned or joined)
// @route   GET /api/user/family-groups
// @access  Private (User)
exports.getFamilyGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
    const userPhone = normalizePhone(req.user.phone);

    const allGroups = await FamilyGroup.find({
      $or: [
        { userId },
        { 'members.userId': userId },
        ...(userEmail ? [{ 'members.email': userEmail }] : []),
        ...(userPhone ? [{ 'members.phone': userPhone }] : [])
      ]
    }).sort({ createdAt: -1 });

    const activeGroups = [];
    const pendingInvitations = [];

    for (const group of allGroups) {
      const isOwner = group.userId && (group.userId.equals ? group.userId.equals(userId) : String(group.userId._id || group.userId) === String(userId));
      if (isOwner) {
        activeGroups.push(group);
        continue;
      }

      const myMembership = group.members.find(m =>
        (m.userId && (m.userId.equals ? m.userId.equals(userId) : String(m.userId._id || m.userId) === String(userId))) ||
        (userEmail && m.email && m.email.toLowerCase() === userEmail) ||
        (userPhone && m.phone && normalizePhone(m.phone) === userPhone)
      );

      if (myMembership) {
        if (myMembership.status === 'accepted') {
          activeGroups.push(group);
        } else if (myMembership.status === 'pending') {
          pendingInvitations.push({
            _id: group._id,
            id: group._id,
            name: group.name,
            description: group.description,
            avatar: group.avatar,
            role: myMembership.role,
            relation: myMembership.relation,
            invitedAt: myMembership.invitedAt,
            memberId: myMembership._id,
            createdAt: group.createdAt
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        groups: activeGroups,
        pendingInvitations,
        totalGroups: activeGroups.length,
        totalPending: pendingInvitations.length
      }
    });
  } catch (error) {
    console.error('getFamilyGroups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve family groups',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get pending family group invitations for authenticated user
// @route   GET /api/user/family-groups/invitations/pending
// @access  Private (User)
exports.getPendingInvitations = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
    const userPhone = normalizePhone(req.user.phone);

    const groups = await FamilyGroup.find({
      userId: { $ne: userId },
      members: {
        $elemMatch: {
          $or: [
            { userId: userId, status: 'pending' },
            ...(userEmail ? [{ email: userEmail, status: 'pending' }] : []),
            ...(userPhone ? [{ phone: userPhone, status: 'pending' }] : [])
          ]
        }
      }
    }).sort({ createdAt: -1 });

    const invitations = groups.map(group => {
      const myMembership = group.members.find(m =>
        m.status === 'pending' && (
          (m.userId && (m.userId.equals ? m.userId.equals(userId) : String(m.userId._id || m.userId) === String(userId))) ||
          (userEmail && m.email && m.email.toLowerCase() === userEmail) ||
          (userPhone && m.phone && normalizePhone(m.phone) === userPhone)
        )
      );
      return {
        _id: group._id,
        id: group._id,
        name: group.name,
        description: group.description,
        avatar: group.avatar,
        role: myMembership?.role || 'member',
        relation: myMembership?.relation || 'Family',
        invitedAt: myMembership?.invitedAt || group.createdAt,
        memberId: myMembership?._id,
        createdAt: group.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: {
        invitations,
        totalPending: invitations.length
      }
    });
  } catch (error) {
    console.error('getPendingInvitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending invitations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// @desc    Get single family group by ID
// @route   GET /api/user/family-groups/:id
// @access  Private (User)
exports.getFamilyGroupById = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Family group not found' });
    }

    // Authorization: Must be owner or accepted member
    const isOwner = group.userId.equals(userId);
    const member = group.members.find(m =>
      (m.userId && m.userId.equals(userId)) ||
      (userEmail && m.email && m.email.toLowerCase() === userEmail)
    );

    if (!isOwner && (!member || member.status !== 'accepted')) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not an active member of this group' });
    }

    res.status(200).json({
      success: true,
      data: {
        group,
        isOwner,
        currentUserRole: isOwner ? 'owner' : (member?.role || 'member'),
        currentUserPermissions: isOwner ? ['all'] : (member?.permissions || ['view_planning'])
      }
    });
  } catch (error) {
    console.error('getFamilyGroupById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve family group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new family group
// @route   POST /api/user/family-groups
// @access  Private (User)
exports.createFamilyGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, description, avatar, members, sharedResources } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    // 5-second idempotency check to prevent rapid duplicate group creations
    const memberCount = Array.isArray(members) ? members.length : 0;
    const idempotencyKey = `${userId}_${name.trim().toLowerCase()}_${memberCount}`;
    const now = Date.now();
    if (recentCreations.has(idempotencyKey)) {
      const cached = recentCreations.get(idempotencyKey);
      if (now - cached.timestamp < 5000) {
        return res.status(200).json({
          success: true,
          message: 'Family group already created',
          data: { group: cached.group }
        });
      }
    }

    const creatorPhone = normalizePhone(req.user.phone);
    const creatorEmail = req.user.email ? req.user.email.toLowerCase() : '';

    // Creator is always added as the accepted admin member
    const creatorMember = {
      userId: req.user._id,
      name: req.user.name || 'Organizer',
      phone: creatorPhone,
      email: creatorEmail,
      relation: 'Creator',
      role: 'admin',
      status: 'accepted',
      permissions: ['all'],
      avatar: req.user.profileImage || '',
      invitedAt: new Date(),
      respondedAt: new Date(),
      inviteTokenHash: null,
      inviteTokenExpiresAt: null
    };

    const sanitizedMembers = [creatorMember];
    const rawTokensMap = {}; // mapping member index -> rawToken for response
    const seenPhones = new Set();
    if (creatorPhone) seenPhones.add(creatorPhone);
    const seenEmails = new Set();
    if (creatorEmail) seenEmails.add(creatorEmail);
    const seenUserIds = new Set([String(userId)]);

    if (Array.isArray(members)) {
      for (const m of members) {
        if (!m || !m.name) continue;
        const normPhone = normalizePhone(m.phone);
        const normEmail = String(m.email || '').trim().toLowerCase();

        // Prevent duplicate against creator or already added member
        if (m.userId && seenUserIds.has(String(m.userId))) continue;
        if (normPhone && seenPhones.has(normPhone)) continue;
        if (normEmail && seenEmails.has(normEmail)) continue;

        if (normPhone) seenPhones.add(normPhone);
        if (normEmail) seenEmails.add(normEmail);

        // Lookup if registered user exists
        let targetUserId = m.userId || null;
        if (!targetUserId && (normEmail || normPhone)) {
          const conditions = [];
          if (normEmail) conditions.push({ email: normEmail });
          if (normPhone) conditions.push({ phone: normPhone });
          const existingUser = await User.findOne({ $or: conditions });
          if (existingUser) {
            targetUserId = existingUser._id;
            seenUserIds.add(String(targetUserId));
          }
        }

        const { rawToken, tokenHash } = generateInviteToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const memberDoc = {
          userId: targetUserId,
          name: String(m.name || 'Member').trim(),
          phone: normPhone,
          email: normEmail,
          relation: String(m.relation || 'Family').trim(),
          role: m.role === 'admin' ? 'admin' : 'member',
          status: 'pending', // REQUIRED: contacts start as pending invitations
          permissions: Array.isArray(m.permissions) ? m.permissions : ['view_planning'],
          avatar: m.avatar || '',
          inviteTokenHash: tokenHash,
          inviteTokenExpiresAt: expiresAt,
          invitedAt: new Date(),
          respondedAt: null
        };

        const idx = sanitizedMembers.length;
        sanitizedMembers.push(memberDoc);
        rawTokensMap[idx] = rawToken;
      }
    }

    const group = await FamilyGroup.create({
      userId,
      name: name.trim(),
      description: description ? description.trim() : '',
      avatar: avatar || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=150&h=150&fit=crop',
      sharedResources: sharedResources || {
        checklist: true,
        budget: false,
        timeline: true,
        guestList: false,
        inspiration: true
      },
      members: sanitizedMembers
    });

    const groupObj = group.toObject();
    // Expose rawTokens in the immediate response for share link generation
    if (groupObj.members && Array.isArray(groupObj.members)) {
      groupObj.members = groupObj.members.map((m, idx) => {
        if (rawTokensMap[idx]) {
          return {
            ...m,
            inviteToken: rawTokensMap[idx],
            inviteLink: `/family/join/${rawTokensMap[idx]}`
          };
        }
        return m;
      });
    }

    recentCreations.set(idempotencyKey, { timestamp: now, group: groupObj });

    res.status(201).json({
      success: true,
      message: 'Family group created successfully',
      data: { group: groupObj }
    });
  } catch (error) {
    console.error('createFamilyGroup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create family group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update family group metadata & shared resources (Owner only)
// @route   PUT /api/user/family-groups/:id
// @access  Private (User - Owner Only)
exports.updateFamilyGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { name, description, avatar, sharedResources } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Family group not found' });
    }

    const isOwner = group.userId && (group.userId.equals ? group.userId.equals(userId) : String(group.userId._id || group.userId) === String(userId));
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Only the group owner can update group settings' });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (avatar) group.avatar = avatar;
    if (sharedResources && typeof sharedResources === 'object') {
      group.sharedResources = { ...group.sharedResources, ...sharedResources };
    }

    await group.save();

    res.status(200).json({
      success: true,
      message: 'Family group updated successfully',
      data: { group }
    });
  } catch (error) {
    console.error('updateFamilyGroup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update family group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Invite member to family group
// @route   POST /api/user/family-groups/:id/members
// @access  Private (User - Owner or Admin)
exports.inviteMember = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { name, email, phone, relation, role, permissions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Member name is required' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Family group not found' });
    }

    const isOwner = group.userId && (group.userId.equals ? group.userId.equals(userId) : String(group.userId._id || group.userId) === String(userId));
    const actingMember = group.members.find(m => m.userId && (m.userId.equals ? m.userId.equals(userId) : String(m.userId._id || m.userId) === String(userId)));
    const isAdmin = actingMember && actingMember.role === 'admin' && actingMember.status === 'accepted';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the owner or group admin can invite members' });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const normPhone = normalizePhone(phone);

    // Duplicate check
    let targetUserId = null;
    if (cleanEmail || normPhone) {
      const conditions = [];
      if (cleanEmail) conditions.push({ email: cleanEmail });
      if (normPhone) conditions.push({ phone: normPhone });
      const existingUser = await User.findOne({ $or: conditions });
      if (existingUser) {
        targetUserId = existingUser._id;
      }

      const alreadyInGroup = group.members.some(m =>
        (m.status !== 'declined' && m.status !== 'revoked') && (
          (cleanEmail && m.email && m.email.toLowerCase() === cleanEmail) ||
          (normPhone && m.phone && normalizePhone(m.phone) === normPhone) ||
          (targetUserId && m.userId && m.userId.equals(targetUserId))
        )
      );
      if (alreadyInGroup) {
        return res.status(400).json({ success: false, message: 'This member has already been added or invited to this group' });
      }
    }

    const { rawToken, tokenHash } = generateInviteToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const newMember = {
      userId: targetUserId,
      name: name.trim(),
      email: cleanEmail,
      phone: normPhone,
      relation: relation ? relation.trim() : 'Family',
      role: isOwner && role === 'admin' ? 'admin' : 'member',
      status: 'pending',
      permissions: Array.isArray(permissions) ? permissions : ['view_planning'],
      inviteTokenHash: tokenHash,
      inviteTokenExpiresAt: expiresAt,
      invitedAt: new Date(),
      respondedAt: null
    };

    group.members.push(newMember);
    await group.save();

    const createdMember = group.members[group.members.length - 1].toObject();
    createdMember.inviteToken = rawToken;
    createdMember.inviteLink = `/family/join/${rawToken}`;

    // Send in-app notification to invited user if registered
    if (targetUserId) {
      try {
        const { notifyAndLogActivity } = require('../../services/notification.service');
        await notifyAndLogActivity({
          userId: targetUserId,
          notificationTitle: 'Family Group Invitation',
          notificationMessage: `You have been invited to join the wedding planning group "${group.name}".`,
          notificationType: 'family',
          activityType: 'family_invite',
          activityTitle: 'Invited to Family Group',
          activityMessage: `Invited to join "${group.name}".`,
          entityType: 'FamilyGroup',
          entityId: group._id,
          eventKey: `family_invite_${group._id}_${targetUserId}`
        });
      } catch (e) {}
    }

    res.status(201).json({
      success: true,
      message: 'Member invitation sent successfully',
      data: {
        member: createdMember,
        inviteToken: rawToken,
        inviteLink: `/family/join/${rawToken}`
      }
    });
  } catch (error) {
    console.error('inviteMember error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invite member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Respond to family group invitation (Accept or Decline)
// @route   PUT /api/user/family-groups/:id/invitations/respond
// @access  Private (User)
exports.respondInvitation = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
    const userPhone = normalizePhone(req.user.phone);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Family group not found' });
    }

    const member = group.members.find(m =>
      (m.userId && (m.userId.equals ? m.userId.equals(userId) : String(m.userId._id || m.userId) === String(userId))) ||
      (userEmail && m.email && m.email.toLowerCase() === userEmail) ||
      (userPhone && m.phone && normalizePhone(m.phone) === userPhone)
    );

    if (!member) {
      return res.status(404).json({ success: false, message: 'No invitation found for your account in this group' });
    }

    const isAccepted = req.body.accept === true || req.body.action === 'accept' || req.body.status === 'accepted';

    if (member.status === 'declined') {
      return res.status(400).json({
        success: false,
        message: 'This invitation was declined and cannot be re-accepted'
      });
    }

    if (member.status === 'revoked') {
      return res.status(400).json({
        success: false,
        message: 'This invitation has been revoked'
      });
    }

    if (member.status === 'accepted') {
      if (isAccepted) {
        return res.status(400).json({
          success: false,
          message: 'This invitation has already been accepted'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Active members cannot decline an accepted group membership'
        });
      }
    }

    const newStatus = isAccepted ? 'accepted' : 'declined';

    // Concurrency-safe atomic transition: only update if status is still 'pending'
    const updatedGroup = await FamilyGroup.findOneAndUpdate(
      {
        _id: id,
        members: {
          $elemMatch: {
            _id: member._id,
            status: 'pending'
          }
        }
      },
      {
        $set: {
          'members.$.status': newStatus,
          'members.$.userId': userId,
          'members.$.respondedAt': new Date(),
          'members.$.inviteTokenHash': null,
          'members.$.inviteTokenExpiresAt': null
        }
      },
      { new: true }
    );

    if (!updatedGroup) {
      return res.status(400).json({
        success: false,
        message: 'Invitation has already been processed or status has changed'
      });
    }

    const updatedMember = updatedGroup.members.id(member._id);

    res.status(200).json({
      success: true,
      message: isAccepted ? 'Invitation accepted successfully' : 'Invitation declined',
      data: { status: updatedMember.status, member: updatedMember },
      membership: { status: updatedMember.status }
    });
  } catch (error) {
    console.error('respondInvitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Remove member from family group (Owner only)
// @route   DELETE /api/user/family-groups/:id/members/:memberId
// @access  Private (User - Owner Only)
exports.removeMember = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Family group not found' });
    }

    if (!group.userId.equals(userId)) {
      return res.status(403).json({ success: false, message: 'Only the group owner can remove members' });
    }

    const memberIndex = group.members.findIndex(m => m._id.equals(memberId));
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: 'Member not found in this group' });
    }

    group.members.splice(memberIndex, 1);
    await group.save();

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('removeMember error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get permitted shared planning data for family group members
// @route   GET /api/user/family-groups/:id/shared-data
// @access  Private (User - Member/Owner Only)
exports.getSharedPlanningData = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Family group not found' });
    }

    const isOwner = group.userId.equals(userId);
    const member = group.members.find(m =>
      (m.userId && m.userId.equals(userId)) ||
      (userEmail && m.email && m.email.toLowerCase() === userEmail)
    );

    if (!isOwner && (!member || member.status !== 'accepted')) {
      return res.status(403).json({ success: false, message: 'Access denied: You must be an accepted member of this group' });
    }

    const shared = group.sharedResources || {};
    const ownerUserId = group.userId;

    const queries = [];
    const keys = [];

    if (shared.checklist) {
      keys.push('checklist');
      queries.push(ChecklistTask.find({ userId: ownerUserId }).select('task category priority dueDate completed').lean());
    }
    if (shared.timeline) {
      keys.push('timeline');
      queries.push(TimelineEvent.find({ userId: ownerUserId }).select('title description date time location status').lean());
    }
    if (shared.budget && (isOwner || member?.role === 'admin')) {
      keys.push('budget');
      queries.push(Budget.findOne({ userId: ownerUserId }).select('totalBudget categories.name categories.allocated categories.spent').lean());
    }
    if (shared.guestList && (isOwner || member?.role === 'admin')) {
      keys.push('guestList');
      queries.push(Guest.find({ userId: ownerUserId }).select('name rsvpStatus guestCount tableNumber').lean());
    }
    if (shared.inspiration) {
      keys.push('inspiration');
      queries.push(Inspiration.find({ userId: ownerUserId }).select('title category image notes').lean());
    }

    const results = await Promise.all(queries);
    const sharedData = {};
    keys.forEach((key, idx) => {
      sharedData[key] = results[idx];
    });

    res.status(200).json({
      success: true,
      data: {
        groupId: group._id,
        groupName: group.name,
        sharedResources: group.sharedResources,
        ...sharedData
      }
    });
  } catch (error) {
    console.error('getSharedPlanningData error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve shared planning data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete family group (Owner only)
// @route   DELETE /api/user/family-groups/:id
// @access  Private (User - Owner Only)
exports.deleteFamilyGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await FamilyGroup.findOneAndDelete({ _id: id, userId });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Family group not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Family group deleted successfully'
    });
  } catch (error) {
    console.error('deleteFamilyGroup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete family group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get messages for a family group
// @route   GET /api/user/family-groups/:id/messages
// @access  Private (User)
exports.getGroupMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Check membership
    const group = await FamilyGroup.findById(id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    const isMember = group.userId.equals(userId) || group.members.some(m => m.userId && m.userId.equals(userId) && m.status === 'accepted');
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member of this group' });

    const messages = await FamilyGroupMessage.find({ groupId: id })
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve messages' });
  }
};

// @desc    Send a message to a family group
// @route   POST /api/user/family-groups/:id/messages
// @access  Private (User)
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { message, type, clientMessageId } = req.body;

    // Check membership
    const group = await FamilyGroup.findById(id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    const member = group.members.find(m => m.userId && m.userId.equals(userId) && m.status === 'accepted');
    const isOwner = group.userId.equals(userId);
    if (!member && !isOwner) return res.status(403).json({ success: false, message: 'Not a member of this group' });

    let senderName = req.user.name || 'User';
    let senderAvatar = req.user.profileImage || '';
    if (member) {
      senderName = member.name;
      senderAvatar = member.avatar || senderAvatar;
    }

    const newMessage = await FamilyGroupMessage.create({
      groupId: id,
      senderId: userId,
      senderName,
      senderAvatar,
      message,
      type: type || 'text',
      clientMessageId
    });

    // Broadcast via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`family_group_${id}`).emit('family_group:message', { message: newMessage });
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// @desc    Get public invitation preview by token (minimized, safe data)
// @route   GET /api/public/family-invitations/:token
// @access  Public
exports.getPublicInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || !token.trim()) {
      return res.status(400).json({ success: false, message: 'Invitation token is required' });
    }

    const tokenHash = hashInviteToken(token);
    const group = await FamilyGroup.findOne({ 'members.inviteTokenHash': tokenHash });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Invalid or non-existent invitation link' });
    }

    const member = group.members.find(m => m.inviteTokenHash === tokenHash);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Invitation record not found' });
    }

    if (member.status === 'revoked') {
      return res.status(400).json({ success: false, message: 'This invitation has been revoked by the group organizer' });
    }

    const isExpired = member.inviteTokenExpiresAt && new Date(member.inviteTokenExpiresAt) < new Date();
    if (isExpired) {
      return res.status(400).json({ success: false, message: 'This invitation link has expired' });
    }

    if (member.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'This invitation has already been accepted' });
    }

    const inviter = await User.findById(group.userId).select('name profileImage');

    res.status(200).json({
      success: true,
      data: {
        groupId: group._id,
        groupName: group.name,
        groupDescription: group.description,
        groupAvatar: group.avatar,
        inviterName: inviter?.name || 'Wedding Host',
        inviteeName: member.name,
        relation: member.relation,
        role: member.role,
        status: member.status,
        isExpired: false
      }
    });
  } catch (error) {
    console.error('getPublicInvitationByToken error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invitation details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Accept invitation using token (Authenticated user)
// @route   POST /api/user/family-groups/join/:token
// @access  Private (User)
exports.joinGroupWithToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const { token } = req.params;

    if (!token || !token.trim()) {
      return res.status(400).json({ success: false, message: 'Invitation token is required' });
    }

    const tokenHash = hashInviteToken(token);
    const group = await FamilyGroup.findOne({ 'members.inviteTokenHash': tokenHash });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Invalid or non-existent invitation link' });
    }

    const member = group.members.find(m => m.inviteTokenHash === tokenHash);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Invitation not found in group' });
    }

    if (member.status === 'revoked') {
      return res.status(400).json({ success: false, message: 'This invitation has been revoked' });
    }

    if (member.inviteTokenExpiresAt && new Date(member.inviteTokenExpiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'This invitation has expired' });
    }

    if (member.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'This invitation has already been accepted' });
    }

    // Contact ownership verification (Safeguards 1 & 3):
    // If the invitation was addressed to a specific email or phone, authenticated user must match
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
    const userPhone = normalizePhone(req.user.phone);

    if (member.email && userEmail && member.email.toLowerCase() !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'This invitation was addressed to a different email address. Please log in with the correct account.'
      });
    }

    if (member.phone && userPhone && normalizePhone(member.phone) !== userPhone) {
      return res.status(403).json({
        success: false,
        message: 'This invitation was addressed to a different phone number. Please log in with the correct account.'
      });
    }

    // Check if user is already an accepted member under another entry in this group
    const alreadyAccepted = group.members.some(m =>
      !m._id.equals(member._id) &&
      m.userId && m.userId.equals(userId) &&
      m.status === 'accepted'
    );
    if (alreadyAccepted) {
      return res.status(400).json({
        success: false,
        message: 'You are already an accepted member of this group'
      });
    }

    // Atomic single-use update: only update if still pending and token hash matches
    const updatedGroup = await FamilyGroup.findOneAndUpdate(
      {
        _id: group._id,
        members: {
          $elemMatch: {
            _id: member._id,
            inviteTokenHash: tokenHash,
            status: 'pending'
          }
        }
      },
      {
        $set: {
          'members.$.userId': userId,
          'members.$.status': 'accepted',
          'members.$.respondedAt': new Date(),
          'members.$.inviteTokenHash': null, // Invalidate token (single-use)
          'members.$.inviteTokenExpiresAt': null
        }
      },
      { new: true }
    );

    if (!updatedGroup) {
      return res.status(400).json({
        success: false,
        message: 'Invitation is no longer valid or has already been accepted'
      });
    }

    const acceptedMember = updatedGroup.members.id(member._id);

    res.status(200).json({
      success: true,
      message: 'Successfully joined the family group',
      data: {
        group: updatedGroup,
        member: acceptedMember
      }
    });
  } catch (error) {
    console.error('joinGroupWithToken error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Revoke a pending invitation (Owner or Admin only)
// @route   DELETE /api/user/family-groups/:id/invitations/:memberId/revoke
// @access  Private (User - Owner/Admin)
exports.revokeInvitation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isOwner = group.userId && (group.userId.equals ? group.userId.equals(userId) : String(group.userId._id || group.userId) === String(userId));
    const actingMember = group.members.find(m => m.userId && (m.userId.equals ? m.userId.equals(userId) : String(m.userId._id || m.userId) === String(userId)));
    const isAdmin = actingMember && actingMember.role === 'admin' && actingMember.status === 'accepted';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only owner or admin can revoke invitations' });
    }

    const member = group.members.id(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (member.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'Cannot revoke an accepted membership. Use remove member instead.' });
    }

    member.status = 'revoked';
    member.inviteTokenHash = null;
    member.inviteTokenExpiresAt = null;
    await group.save();

    res.status(200).json({
      success: true,
      message: 'Invitation revoked successfully'
    });
  } catch (error) {
    console.error('revokeInvitation error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke invitation' });
  }
};

// @desc    Get or generate fresh shareable invitation link for a pending member (Owner/Admin)
// @route   POST /api/user/family-groups/:id/members/:memberId/share-link
// @access  Private (User - Owner/Admin)
exports.getOrRefreshMemberInviteLink = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isOwner = group.userId && (group.userId.equals ? group.userId.equals(userId) : String(group.userId._id || group.userId) === String(userId));
    const actingMember = group.members.find(m => m.userId && (m.userId.equals ? m.userId.equals(userId) : String(m.userId._id || m.userId) === String(userId)));
    const isAdmin = actingMember && actingMember.role === 'admin' && actingMember.status === 'accepted';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only owner or admin can generate share links' });
    }

    const member = group.members.id(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in this group' });
    }

    if (member.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'This member has already accepted and joined the group' });
    }

    if (member.status === 'revoked') {
      return res.status(400).json({ success: false, message: 'This invitation was revoked. Please reinvite the contact.' });
    }

    // Generate fresh cryptographic token & update hash
    const { rawToken, tokenHash } = generateInviteToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    member.inviteTokenHash = tokenHash;
    member.inviteTokenExpiresAt = expiresAt;
    member.status = 'pending';
    await group.save();

    res.status(200).json({
      success: true,
      message: 'Share link generated successfully',
      data: {
        memberId: member._id,
        memberName: member.name,
        memberPhone: member.phone,
        memberEmail: member.email,
        inviteToken: rawToken,
        inviteLink: `/family/join/${rawToken}`
      }
    });
  } catch (error) {
    console.error('getOrRefreshMemberInviteLink error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate share link' });
  }
};

// @desc    Delete family group (Owner only)
// @route   DELETE /api/user/family-groups/:id
// @access  Private (User - Owner Only)
exports.deleteFamilyGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Family group not found' });
    }

    const isOwner = group.userId && (group.userId.equals ? group.userId.equals(userId) : String(group.userId._id || group.userId) === String(userId));
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Only the group owner can delete this group' });
    }

    await FamilyGroupMessage.deleteMany({ groupId: id });
    await FamilyGroup.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Family group deleted successfully'
    });
  } catch (error) {
    console.error('deleteFamilyGroup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete family group',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


