const mongoose = require('mongoose');
const FamilyGroup = require('./FamilyGroup');
const User = require('./user.model');
const ChecklistTask = require('./ChecklistTask');
const TimelineEvent = require('./TimelineEvent');
const Budget = require('./Budget');
const Guest = require('./Guest');
const Inspiration = require('./Inspiration');

// @desc    Get user's family groups (owned or joined)
// @route   GET /api/user/family-groups
// @access  Private (User)
exports.getFamilyGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';

    const groups = await FamilyGroup.find({
      $or: [
        { userId },
        { 'members.userId': userId, 'members.status': 'accepted' },
        ...(userEmail ? [{ 'members.email': userEmail, 'members.status': 'accepted' }] : [])
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        groups,
        totalGroups: groups.length
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

    const sanitizedMembers = Array.isArray(members)
      ? members.map(m => ({
          userId: m.userId || null,
          name: String(m.name || 'Member').trim(),
          phone: String(m.phone || '').trim(),
          email: String(m.email || '').trim().toLowerCase(),
          relation: String(m.relation || 'Family').trim(),
          role: m.role === 'admin' ? 'admin' : 'member',
          status: m.status || 'accepted',
          permissions: Array.isArray(m.permissions) ? m.permissions : ['view_planning'],
          avatar: m.avatar || '',
          invitedAt: new Date(),
          respondedAt: m.status === 'accepted' ? new Date() : null
        }))
      : [];

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

    res.status(201).json({
      success: true,
      message: 'Family group created successfully',
      data: { group }
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

    if (!group.userId.equals(userId)) {
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

    const isOwner = group.userId.equals(userId);
    const actingMember = group.members.find(m => m.userId && m.userId.equals(userId));
    const isAdmin = actingMember && actingMember.role === 'admin' && actingMember.status === 'accepted';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the owner or group admin can invite members' });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    let targetUserId = null;

    if (cleanEmail) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        targetUserId = existingUser._id;
      }
      // Check if already in group
      const alreadyInGroup = group.members.some(m =>
        (m.email && m.email.toLowerCase() === cleanEmail) ||
        (m.userId && targetUserId && m.userId.equals(targetUserId))
      );
      if (alreadyInGroup) {
        return res.status(400).json({ success: false, message: 'This member has already been added or invited to this group' });
      }
    }

    const newMember = {
      userId: targetUserId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      relation: relation ? relation.trim() : 'Family',
      role: isOwner && role === 'admin' ? 'admin' : 'member',
      status: 'pending',
      permissions: Array.isArray(permissions) ? permissions : ['view_planning'],
      invitedAt: new Date()
    };

    group.members.push(newMember);
    await group.save();

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
      data: { member: group.members[group.members.length - 1] }
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
    const { id } = req.params;
    const { accept } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await FamilyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Family group not found' });
    }

    const member = group.members.find(m =>
      (m.userId && m.userId.equals(userId)) ||
      (userEmail && m.email && m.email.toLowerCase() === userEmail)
    );

    if (!member) {
      return res.status(404).json({ success: false, message: 'No invitation found for your account in this group' });
    }

    const isAccepted = req.body.accept === true || req.body.action === 'accept' || req.body.status === 'accepted';
    member.status = isAccepted ? 'accepted' : 'declined';
    member.respondedAt = new Date();
    if (!member.userId) member.userId = userId;

    await group.save();

    res.status(200).json({
      success: true,
      message: isAccepted ? 'Invitation accepted successfully' : 'Invitation declined',
      data: { status: member.status, member },
      membership: { status: member.status }
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
