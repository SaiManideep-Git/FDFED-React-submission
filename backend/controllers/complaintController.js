const Complaint = require('../models/index').Complaint;
const mongoose = require('mongoose');

// Submit a complaint (company or customer)
exports.submitComplaint = async (req, res) => {
  try {
    const { projectId, milestone, senderType, senderId, message } = req.body;
    console.log('📝 Submitting complaint:', { projectId, milestone, senderType, senderId, message });
    if (![0, 25, 50, 75, 100].includes(Number(milestone))) {
      return res.status(400).json({ error: 'Invalid milestone' });
    }
    const complaint = new Complaint({
      projectId,
      milestone,
      senderType,
      senderId,
      message,
      replies: []
    });
    await complaint.save();
    console.log('✅ Complaint saved:', complaint);
    res.json({ success: true, complaint });
  } catch (err) {
    console.error('❌ Error saving complaint:', err);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
};

// Get all complaints for a project (admin)
exports.getProjectComplaints = async (req, res) => {
  try {
    const { projectId } = req.params;
    const complaints = await Complaint.find({ projectId })
      .sort({ createdAt: -1 });
    
    // Mark all complaints as viewed
    await Complaint.updateMany(
      { projectId, isViewed: false },
      { $set: { isViewed: true } }
    );
    
    res.json({ success: true, complaints });
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ error: 'Failed to fetch complaints', details: err.message });
  }
};

// Get unviewed complaints count for admin dashboard
exports.getUnviewedComplaintsCount = async (req, res) => {
  try {
    const unviewedByProject = await Complaint.aggregate([
      { $match: { isViewed: false } },
      { $group: { _id: '$projectId', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, unviewedByProject });
  } catch (err) {
    console.error('Error fetching unviewed complaints:', err);
    res.status(500).json({ error: 'Failed to fetch unviewed complaints count' });
  }
};

// Get unviewed complaints count for company (only from customers)
exports.getCompanyUnviewedComplaintsCount = async (req, res) => {
  try {
    console.log('🔍 Getting unviewed complaints for company (customer complaints only)');
    
    // First, let's see ALL complaints
    const allComplaints = await Complaint.find({});
    console.log('📊 Total complaints in DB:', allComplaints.length);
    console.log('📊 All complaints:', allComplaints.map(c => ({
      id: c._id,
      projectId: c.projectId,
      milestone: c.milestone,
      senderType: c.senderType,
      isViewed: c.isViewed
    })));
    
    const unviewedByProject = await Complaint.aggregate([
      { $match: { isViewed: false, senderType: 'customer' } },
      { $group: { _id: '$projectId', count: { $sum: 1 } } }
    ]);
    console.log('🔍 Found unviewed complaints:', unviewedByProject);
    res.json({ success: true, unviewedByProject });
  } catch (err) {
    console.error('Error fetching unviewed complaints:', err);
    res.status(500).json({ error: 'Failed to fetch unviewed complaints count' });
  }
};

// Admin reply to a complaint
exports.replyToComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { adminId, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    complaint.replies.push({ adminId, message });
    await complaint.save();
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reply to complaint' });
  }
};
