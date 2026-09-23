const mongoose = require('mongoose');
const FamilyGroup = require('../modules/user/FamilyGroup');

/**
 * Pre-upload and access authorization middleware.
 * Strictly verifies that the authenticated user is either the group owner
 * or an active member with status === 'accepted' BEFORE Multer processes uploads.
 */
const verifyAcceptedFamilyMember = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.params.id;
    if (!groupId) {
      return res.status(400).json({ success: false, message: 'Group ID parameter is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await FamilyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Family group not found' });
    }

    const userId = req.user ? req.user._id : null;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const isOwner = group.userId && (group.userId.equals ? group.userId.equals(userId) : String(group.userId._id || group.userId) === String(userId));
    if (isOwner) {
      req.familyGroup = group;
      req.isGroupOwner = true;
      req.groupRole = 'owner';
      return next();
    }

    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';

    const member = group.members.find(m =>
      (m.userId && (m.userId.equals ? m.userId.equals(userId) : String(m.userId._id || m.userId) === String(userId))) ||
      (userEmail && m.email && m.email.toLowerCase() === userEmail)
    );

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this family group'
      });
    }

    if (member.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Your invitation is still pending. Please accept your invitation first.'
      });
    }

    if (member.status === 'pending_approval') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Your request to join this group is awaiting host approval.'
      });
    }

    if (member.status === 'declined') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Your membership or invitation was declined.'
      });
    }

    if (member.status === 'revoked') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Your membership has been revoked by the group organizer.'
      });
    }

    if (member.status !== 'accepted') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You must be an accepted member to perform this action.'
      });
    }

    req.familyGroup = group;
    req.groupMember = member;
    req.isGroupOwner = false;
    req.groupRole = member.role || 'member';
    next();
  } catch (error) {
    console.error('verifyAcceptedFamilyMember error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify group membership',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Authorization middleware ensuring caller is the group owner or accepted admin.
 */
const verifyGroupAdminOrOwner = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.params.id;
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: 'Valid group ID required' });
    }

    const group = await FamilyGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Family group not found' });
    }

    const userId = req.user._id;
    const isOwner = group.userId && (group.userId.equals ? group.userId.equals(userId) : String(group.userId._id || group.userId) === String(userId));
    const member = group.members.find(m => m.userId && (m.userId.equals ? m.userId.equals(userId) : String(m.userId._id || m.userId) === String(userId)));
    const isAdmin = member && member.role === 'admin' && member.status === 'accepted';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the group owner or an admin can perform this administrative action'
      });
    }

    req.familyGroup = group;
    req.isGroupOwner = isOwner;
    req.groupMember = member;
    next();
  } catch (error) {
    console.error('verifyGroupAdminOrOwner error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify administrative authorization' });
  }
};

module.exports = {
  verifyAcceptedFamilyMember,
  verifyGroupAdminOrOwner
};
