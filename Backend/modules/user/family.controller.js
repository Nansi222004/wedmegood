const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const FamilyGroup = require('./FamilyGroup');
const FamilyGroupMessage = require('./FamilyGroupMessage');
const User = require('./user.model');
const ChecklistTask = require('./ChecklistTask');
const TimelineEvent = require('./TimelineEvent');
const Budget = require('./Budget');
const Guest = require('./Guest');
const Inspiration = require('./Inspiration');
const { getSignedAttachmentUrl, destroyFile } = require('../../utils/cloudinary');

// Resolve configured production frontend URL
const getFrontendUrl = (req) => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.replace(/\/+$/, '');
  }
  const origin = req ? (req.get('origin') || req.get('referer')) : null;
  if (origin) {
    try {
      const parsed = new URL(origin);
      return parsed.origin;
    } catch (e) {}
  }
  return 'http://localhost:5174';
};

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
    const frontendUrl = getFrontendUrl(req);
    // Expose rawTokens in the immediate response for share link generation
    if (groupObj.members && Array.isArray(groupObj.members)) {
      groupObj.members = groupObj.members.map((m, idx) => {
        if (rawTokensMap[idx]) {
          return {
            ...m,
            inviteToken: rawTokensMap[idx],
            inviteLink: `/family/join/${rawTokensMap[idx]}`,
            inviteUrl: `${frontendUrl}/family/join/${rawTokensMap[idx]}`
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

    const frontendUrl = getFrontendUrl(req);
    const createdMember = group.members[group.members.length - 1].toObject();
    createdMember.inviteToken = rawToken;
    createdMember.inviteLink = `/family/join/${rawToken}`;
    createdMember.inviteUrl = `${frontendUrl}/family/join/${rawToken}`;

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
        inviteLink: `/family/join/${rawToken}`,
        inviteUrl: `${frontendUrl}/family/join/${rawToken}`
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

    const populatedMessages = messages.map(msg => {
      const msgObj = msg.toObject();
      if (msgObj.attachments && Array.isArray(msgObj.attachments)) {
        msgObj.attachments = msgObj.attachments.map((att, idx) => {
          const freshSignedUrl = att.publicId ? getSignedAttachmentUrl(att.publicId, att.resourceType, 3600) : null;
          return {
            ...att,
            url: freshSignedUrl || att.url,
            downloadUrl: `/api/user/family-groups/${id}/attachments/${msg._id}/${idx}`
          };
        });
      }
      return msgObj;
    });

    res.status(200).json({ success: true, data: populatedMessages });
  } catch (error) {
    console.error('getGroupMessages error:', error);
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
    const { message, type, clientMessageId, attachments } = req.body;

    // Check membership
    const group = await FamilyGroup.findById(id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    const member = group.members.find(m => m.userId && m.userId.equals(userId) && m.status === 'accepted');
    const isOwner = group.userId.equals(userId);
    if (!member && !isOwner) return res.status(403).json({ success: false, message: 'Not a member of this group' });

    // Idempotency check
    if (clientMessageId) {
      const existing = await FamilyGroupMessage.findOne({ groupId: id, clientMessageId });
      if (existing) {
        return res.status(200).json({ success: true, isDuplicate: true, data: existing });
      }
    }

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
      message: (message || '').trim(),
      type: type || (attachments && attachments.length ? attachments[0].type : 'text'),
      attachments: Array.isArray(attachments) ? attachments : [],
      clientMessageId
    });

    // Broadcast via socket strictly after successful persistence
    const io = req.app.get('io');
    if (io) {
      io.to(`family_group_${id}`).emit('family_group:message', { message: newMessage });
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    console.error('sendMessage error:', error);
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

    const frontendUrl = getFrontendUrl(req);

    res.status(200).json({
      success: true,
      message: 'Share link generated successfully',
      data: {
        memberId: member._id,
        memberName: member.name,
        memberPhone: member.phone,
        memberEmail: member.email,
        inviteToken: rawToken,
        inviteLink: `/family/join/${rawToken}`,
        inviteUrl: `${frontendUrl}/family/join/${rawToken}`
      }
    });
  } catch (error) {
    console.error('getOrRefreshMemberInviteLink error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate share link' });
  }
};

// @desc    Get or generate fresh shareable invitation link for entire group (Owner/Admin)
// @route   POST /api/user/family-groups/:id/group-invite/share-link
// @access  Private (User - Owner/Admin)
exports.getOrRefreshGroupInviteLink = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) return res.status(404).json({ success: false, message: 'Family group not found' });

    const isOwner = group.userId && (group.userId.equals ? group.userId.equals(userId) : String(group.userId._id || group.userId) === String(userId));
    const actingMember = group.members.find(m => m.userId && (m.userId.equals ? m.userId.equals(userId) : String(m.userId._id || m.userId) === String(userId)));
    const isAdmin = actingMember && actingMember.role === 'admin' && actingMember.status === 'accepted';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only owner or admin can generate group share links' });
    }

    const { rawToken, tokenHash } = generateInviteToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    group.groupInviteTokenHash = tokenHash;
    group.groupInviteExpiresAt = expiresAt;
    group.groupInviteEnabled = true;
    if (req.body.role === 'admin' && isOwner) {
      group.groupInviteRole = 'admin';
    } else {
      group.groupInviteRole = 'member';
    }
    await group.save();

    const frontendUrl = getFrontendUrl(req);

    res.status(200).json({
      success: true,
      message: 'Group share link generated successfully',
      data: {
        groupId: group._id,
        groupName: group.name,
        inviteToken: rawToken,
        inviteLink: `/family/join-group/${rawToken}`,
        inviteUrl: `${frontendUrl}/family/join-group/${rawToken}`,
        expiresAt: group.groupInviteExpiresAt,
        requiresApproval: true
      }
    });
  } catch (error) {
    console.error('getOrRefreshGroupInviteLink error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate group invite link' });
  }
};

// @desc    Revoke general group invitation link (Owner/Admin only)
// @route   DELETE /api/user/family-groups/:id/group-invite/revoke
// @access  Private (User - Owner/Admin)
exports.revokeGroupInviteLink = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) return res.status(404).json({ success: false, message: 'Family group not found' });

    const isOwner = group.userId && (group.userId.equals ? group.userId.equals(userId) : String(group.userId._id || group.userId) === String(userId));
    const actingMember = group.members.find(m => m.userId && (m.userId.equals ? m.userId.equals(userId) : String(m.userId._id || m.userId) === String(userId)));
    const isAdmin = actingMember && actingMember.role === 'admin' && actingMember.status === 'accepted';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only owner or admin can revoke group share links' });
    }

    // Invalidate token without removing existing members
    group.groupInviteTokenHash = null;
    group.groupInviteExpiresAt = null;
    group.groupInviteEnabled = false;
    await group.save();

    res.status(200).json({
      success: true,
      message: 'General group invitation link revoked successfully. Existing members are not affected.'
    });
  } catch (error) {
    console.error('revokeGroupInviteLink error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke group invite link' });
  }
};

// @desc    Get public general group invitation preview by token
// @route   GET /api/public/family-groups/preview/:token
// @access  Public
exports.getPublicGroupPreviewByToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || !token.trim()) {
      return res.status(400).json({ success: false, message: 'Invitation token is required' });
    }

    const tokenHash = hashInviteToken(token);
    const group = await FamilyGroup.findOne({
      groupInviteTokenHash: tokenHash,
      groupInviteEnabled: true
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Invalid or revoked group invitation link' });
    }

    if (group.groupInviteExpiresAt && new Date(group.groupInviteExpiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'This group invitation link has expired' });
    }

    const host = await User.findById(group.userId).select('name profileImage');
    const acceptedCount = group.members.filter(m => m.status === 'accepted').length;

    res.status(200).json({
      success: true,
      data: {
        groupId: group._id,
        groupName: group.name,
        groupDescription: group.description,
        groupAvatar: group.avatar,
        hostName: host?.name || 'Wedding Host',
        memberCount: acceptedCount,
        requiresApproval: true,
        isExpired: false
      }
    });
  } catch (error) {
    console.error('getPublicGroupPreviewByToken error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve group invitation details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Submit request to join group via general link (Authenticated User)
// @route   POST /api/user/family-groups/join-group/:token
// @access  Private (User)
exports.requestJoinGroupWithToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const { token } = req.params;

    if (!token || !token.trim()) {
      return res.status(400).json({ success: false, message: 'Invitation token is required' });
    }

    const tokenHash = hashInviteToken(token);
    const group = await FamilyGroup.findOne({
      groupInviteTokenHash: tokenHash,
      groupInviteEnabled: true
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Invalid or revoked group invitation link' });
    }

    if (group.groupInviteExpiresAt && new Date(group.groupInviteExpiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'This group invitation link has expired' });
    }

    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
    const userPhone = normalizePhone(req.user.phone);

    // Is owner?
    if (group.userId && (group.userId.equals ? group.userId.equals(userId) : String(group.userId._id || group.userId) === String(userId))) {
      return res.status(400).json({ success: false, message: 'You are the owner of this group' });
    }

    // Existing member check
    const existingMember = group.members.find(m =>
      (m.userId && (m.userId.equals ? m.userId.equals(userId) : String(m.userId._id || m.userId) === String(userId))) ||
      (userEmail && m.email && m.email.toLowerCase() === userEmail) ||
      (userPhone && m.phone && normalizePhone(m.phone) === userPhone)
    );

    if (existingMember) {
      if (existingMember.status === 'accepted') {
        return res.status(200).json({
          success: true,
          message: 'You are already an accepted member of this group',
          data: { status: 'accepted', groupId: group._id }
        });
      }
      if (existingMember.status === 'pending_approval') {
        return res.status(200).json({
          success: true,
          message: 'Your join request has already been submitted and is awaiting host approval.',
          data: { status: 'pending_approval', groupId: group._id }
        });
      }
      if (existingMember.status === 'pending') {
        // User had a pending individual invite -> auto-accept and link
        existingMember.status = 'accepted';
        existingMember.userId = userId;
        existingMember.respondedAt = new Date();
        existingMember.inviteTokenHash = null;
        existingMember.inviteTokenExpiresAt = null;
        await group.save();

        return res.status(200).json({
          success: true,
          message: 'Your pending invitation has been accepted. Welcome to the group!',
          data: { status: 'accepted', groupId: group._id }
        });
      }
      if (existingMember.status === 'declined' || existingMember.status === 'revoked') {
        // Re-request join
        existingMember.status = 'pending_approval';
        existingMember.userId = userId;
        existingMember.joinRequestedAt = new Date();
        existingMember.respondedAt = null;
        await group.save();

        return res.status(200).json({
          success: true,
          message: 'Your request to re-join this group has been submitted for host approval.',
          data: { status: 'pending_approval', groupId: group._id }
        });
      }
    }

    // Add new pending_approval member
    const newMember = {
      userId,
      name: req.user.name || 'Member',
      email: userEmail,
      phone: userPhone,
      relation: 'Family',
      role: group.groupInviteRole || 'member',
      status: 'pending_approval',
      permissions: ['view_planning'],
      avatar: req.user.profileImage || '',
      joinRequestedAt: new Date()
    };

    group.members.push(newMember);
    await group.save();

    res.status(201).json({
      success: true,
      message: 'Join request submitted successfully. Awaiting approval from the group host.',
      data: {
        status: 'pending_approval',
        groupId: group._id,
        groupName: group.name
      }
    });
  } catch (error) {
    console.error('requestJoinGroupWithToken error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit join request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get pending join requests for a group (Owner/Admin)
// @route   GET /api/user/family-groups/:id/join-requests
// @access  Private (User - Owner/Admin)
exports.getJoinRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) return res.status(404).json({ success: false, message: 'Family group not found' });

    const isOwner = group.userId && (group.userId.equals ? group.userId.equals(userId) : String(group.userId._id || group.userId) === String(userId));
    const actingMember = group.members.find(m => m.userId && (m.userId.equals ? m.userId.equals(userId) : String(m.userId._id || m.userId) === String(userId)));
    const isAdmin = actingMember && actingMember.role === 'admin' && actingMember.status === 'accepted';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only owner or admin can review join requests' });
    }

    const requests = group.members
      .filter(m => m.status === 'pending_approval')
      .map(m => ({
        _id: m._id,
        memberId: m._id,
        userId: m.userId,
        name: m.name,
        email: m.email,
        phone: m.phone,
        avatar: m.avatar,
        role: m.role,
        relation: m.relation,
        joinRequestedAt: m.joinRequestedAt || m.invitedAt
      }));

    res.status(200).json({
      success: true,
      data: {
        requests,
        totalRequests: requests.length
      }
    });
  } catch (error) {
    console.error('getJoinRequests error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve join requests' });
  }
};

// @desc    Approve or reject a join request (Owner/Admin)
// @route   PUT /api/user/family-groups/:id/join-requests/:memberId
// @access  Private (User - Owner/Admin)
exports.respondJoinRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, memberId } = req.params;
    const { action, role } = req.body; // action: 'approve' | 'reject'

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const isApprove = action === 'approve' || req.body.status === 'accepted';
    const isReject = action === 'reject' || req.body.status === 'declined';

    if (!isApprove && !isReject) {
      return res.status(400).json({ success: false, message: 'Action must be "approve" or "reject"' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) return res.status(404).json({ success: false, message: 'Family group not found' });

    const isOwner = group.userId && (group.userId.equals ? group.userId.equals(userId) : String(group.userId._id || group.userId) === String(userId));
    const actingMember = group.members.find(m => m.userId && (m.userId.equals ? m.userId.equals(userId) : String(m.userId._id || m.userId) === String(userId)));
    const isAdmin = actingMember && actingMember.role === 'admin' && actingMember.status === 'accepted';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only owner or admin can review join requests' });
    }

    const member = group.members.id(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Join request record not found' });
    }

    if (member.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: `This request has already been processed (Current status: ${member.status})`
      });
    }

    if (isApprove) {
      member.status = 'accepted';
      member.respondedAt = new Date();
      member.approvedBy = userId;
      if (role && isOwner) {
        member.role = role === 'admin' ? 'admin' : 'member';
      }
    } else {
      member.status = 'declined';
      member.respondedAt = new Date();
      member.approvedBy = userId;
    }

    await group.save();

    // Broadcast member update via socket if approved
    const io = req.app.get('io');
    if (io && isApprove) {
      io.to(`family_group_${id}`).emit('family_group:member_joined', {
        groupId: id,
        member: {
          _id: member._id,
          name: member.name,
          role: member.role,
          avatar: member.avatar
        }
      });
    }

    res.status(200).json({
      success: true,
      message: isApprove ? 'Join request approved successfully' : 'Join request rejected',
      data: {
        memberId: member._id,
        status: member.status
      }
    });
  } catch (error) {
    console.error('respondJoinRequest error:', error);
    res.status(500).json({ success: false, message: 'Failed to process join request' });
  }
};

// @desc    Pre-authorized family group attachment upload
// @route   POST /api/user/family-groups/:id/attachments
// @access  Private (User - Accepted Member/Owner only)
exports.uploadFamilyAttachment = async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'Please attach a valid file' });
  }

  const isVideo = file.mimetype.startsWith('video/');
  const isDoc = !isVideo && !file.mimetype.startsWith('image/');
  const attType = isVideo ? 'video' : (isDoc ? 'document' : 'image');
  const resourceType = isVideo ? 'video' : (isDoc ? 'raw' : 'image');
  const publicId = file.filename || file.public_id || null;
  const storagePath = file.path || null;

  // Category file size validation
  if (attType === 'image' && file.size > 10 * 1024 * 1024) {
    await destroyFile({ publicId, resourceType, storagePath });
    return res.status(400).json({ success: false, message: 'Image exceeds maximum permitted size of 10MB' });
  }
  if (attType === 'video' && file.size > 50 * 1024 * 1024) {
    await destroyFile({ publicId, resourceType, storagePath });
    return res.status(400).json({ success: false, message: 'Video exceeds maximum permitted size of 50MB' });
  }
  if (attType === 'document' && file.size > 20 * 1024 * 1024) {
    await destroyFile({ publicId, resourceType, storagePath });
    return res.status(400).json({ success: false, message: 'Document exceeds maximum permitted size of 20MB' });
  }

  // Idempotency / Duplicate check
  const { clientMessageId, caption } = req.body;
  if (clientMessageId) {
    const existingMsg = await FamilyGroupMessage.findOne({ groupId: id, clientMessageId });
    if (existingMsg) {
      await destroyFile({ publicId, resourceType, storagePath });
      return res.status(200).json({
        success: true,
        message: 'Message already received',
        isDuplicate: true,
        data: existingMsg
      });
    }
  }

  try {
    const userId = req.user._id;
    const member = req.groupMember;
    const senderName = member ? member.name : (req.user.name || 'User');
    const senderAvatar = member?.avatar || req.user.profileImage || '';

    // Generate signed URL for Cloudinary authenticated asset or fallback URL
    const signedUrl = publicId ? getSignedAttachmentUrl(publicId, resourceType, 3600) : (file.path || file.secure_url || '');

    const attachmentDoc = {
      url: signedUrl || '',
      downloadUrl: '',
      type: attType,
      name: file.originalname || 'attachment',
      size: file.size || 0,
      mimeType: file.mimetype,
      publicId: publicId,
      resourceType: resourceType,
      storagePath: storagePath
    };

    const newMessage = await FamilyGroupMessage.create({
      groupId: id,
      senderId: userId,
      senderName,
      senderAvatar,
      message: (caption || '').trim(),
      type: attType,
      attachments: [attachmentDoc],
      clientMessageId: clientMessageId || `srv_${Date.now()}`
    });

    newMessage.attachments[0].downloadUrl = `/api/user/family-groups/${id}/attachments/${newMessage._id}/0`;
    await newMessage.save();

    // Post-persistence Socket.io broadcast strictly after DB success
    const io = req.app.get('io');
    if (io) {
      io.to(`family_group_${id}`).emit('family_group:message', { message: newMessage });
    }

    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    console.error('uploadFamilyAttachment error:', error);
    await destroyFile({ publicId, resourceType, storagePath });
    res.status(500).json({ success: false, message: 'Failed to persist attachment message' });
  }
};

// @desc    Protected gateway to view/download private family group attachments
// @route   GET /api/user/family-groups/:id/attachments/:messageId/:attachmentIndex?
// @access  Private (User - Accepted Member/Owner only)
exports.getPrivateAttachment = async (req, res) => {
  try {
    const { id, messageId, attachmentIndex } = req.params;
    const idx = parseInt(attachmentIndex || '0', 10);

    const message = await FamilyGroupMessage.findOne({ _id: messageId, groupId: id });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const attachment = message.attachments && message.attachments[idx];
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    // Cloudinary authenticated resource -> generate fresh short-lived signed URL
    if (attachment.publicId) {
      const signedUrl = getSignedAttachmentUrl(attachment.publicId, attachment.resourceType, 3600);
      if (signedUrl) {
        return res.redirect(302, signedUrl);
      }
    }

    // Local disk private storage fallback
    if (attachment.storagePath && fs.existsSync(attachment.storagePath)) {
      return res.sendFile(path.resolve(attachment.storagePath));
    }

    if (attachment.url && attachment.url.startsWith('http')) {
      return res.redirect(302, attachment.url);
    }

    return res.status(404).json({ success: false, message: 'Attachment file not found' });
  } catch (error) {
    console.error('getPrivateAttachment error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve attachment' });
  }
};


