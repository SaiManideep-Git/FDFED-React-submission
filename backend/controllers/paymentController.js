const { Worker, ArchitectHiring, DesignRequest, Transaction } = require('../models');

// ============================================================================
// PAYMENT CONFIGURATION
// ============================================================================
const COMMISSION_RATES = {
  basic: 15,      // 15% commission for basic plan
  pro: 10,        // 10% commission for pro plan (₹999/month)
  premium: 5      // 5% commission for premium plan (₹1999/month)
};

const MILESTONE_PERCENTAGES = [25, 50, 75, 100];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate commission and worker payout for a given amount
 */
const calculatePaymentBreakdown = (amount, commissionRate) => {
  const platformCommission = (amount * commissionRate) / 100;
  const workerAmount = amount - platformCommission;
  
  return {
    totalAmount: amount,
    platformCommission: Math.round(platformCommission * 100) / 100,
    workerAmount: Math.round(workerAmount * 100) / 100
  };
};

/**
 * Calculate milestone payment breakdowns
 */
const calculateMilestonePayments = (totalAmount, commissionRate) => {
  const payments = [];
  
  MILESTONE_PERCENTAGES.forEach(percentage => {
    const milestoneAmount = (totalAmount * percentage) / 100;
    const platformFee = (milestoneAmount * commissionRate) / 100;
    const workerPayout = milestoneAmount - platformFee;
    
    payments.push({
      percentage,
      amount: Math.round(milestoneAmount * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      workerPayout: Math.round(workerPayout * 100) / 100,
      status: 'pending'
    });
  });
  
  return payments;
};

/**
 * Reset monthly/yearly earnings if needed
 */
const resetPeriodicEarnings = (worker) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Reset monthly earnings if month changed
  if (worker.earnings.lastResetMonth !== currentMonth) {
    worker.earnings.monthlyEarnings = 0;
    worker.earnings.lastResetMonth = currentMonth;
  }
  
  // Reset yearly earnings if year changed
  if (worker.earnings.lastResetYear !== currentYear) {
    worker.earnings.yearlyEarnings = 0;
    worker.earnings.lastResetYear = currentYear;
  }
  
  return worker;
};

// ============================================================================
// ESCROW INITIALIZATION (Called when customer accepts proposal)
// ============================================================================

/**
 * Initialize escrow when customer accepts a proposal
 * UPDATED: Only collects 25% deposit (first milestone) upfront
 * Remaining milestones will be collected as work progresses
 */
const initializeEscrow = async (req, res) => {
  try {
    const { projectId, projectType } = req.body;
    
    if (!projectId || !projectType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID and type are required' 
      });
    }
    
    // Get the project model based on type
    let Project;
    if (projectType === 'architect') {
      Project = ArchitectHiring;
    } else if (projectType === 'interior') {
      Project = DesignRequest;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid project type. Must be "architect" or "interior"' 
      });
    }
    
    // Find the project and populate worker details
    const project = await Project.findById(projectId).populate('worker');
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    if (!project.worker) {
      return res.status(400).json({ 
        success: false, 
        message: 'No worker assigned to this project' 
      });
    }
    
    if (!project.finalAmount || project.finalAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project must have a valid final amount' 
      });
    }
    
    // Get worker's commission rate
    const worker = await Worker.findById(project.worker._id);
    const commissionRate = worker.commissionRate || COMMISSION_RATES.basic;
    
    // Calculate payment breakdown
    const breakdown = calculatePaymentBreakdown(project.finalAmount, commissionRate);
    
    // Calculate milestone payments (each milestone is 25%)
    const milestonePayments = calculateMilestonePayments(project.finalAmount, commissionRate);
    
    // Mark ONLY first milestone (25%) as paid - this is the deposit
    milestonePayments[0].paymentCollected = true;
    milestonePayments[0].paymentCollectedAt = new Date();
    
    // Calculate deposit amount (first milestone only)
    const depositAmount = milestonePayments[0].amount;
    const depositWorkerPayout = milestonePayments[0].workerPayout;
    const depositPlatformFee = milestonePayments[0].platformFee;
    
    // Change status to Accepted now that payment is completed
    if (projectType === 'architect') {
      project.status = 'Accepted';
    } else if (projectType === 'interior') {
      project.status = 'accepted';
    }
    
    // Initialize payment details
    project.paymentDetails = {
      totalAmount: breakdown.totalAmount,
      platformCommission: breakdown.platformCommission,
      workerAmount: breakdown.workerAmount,
      escrowStatus: 'held',
      milestonePayments: milestonePayments,
      paymentInitiatedAt: new Date()
    };
    
    await project.save();
    
    // Split the 25% deposit: 15% immediate advance + 10% held for first milestone
    const immediateAdvancePercent = 0.6; // 60% of deposit = 15% of total project
    const immediateAdvance = depositWorkerPayout * immediateAdvancePercent;
    const heldForMilestone = depositWorkerPayout * (1 - immediateAdvancePercent);
    
    // Create deposit transaction (25% only)
    const depositTransaction = new Transaction({
      transactionType: 'escrow_hold',
      amount: depositAmount,
      platformFee: depositPlatformFee,
      netAmount: depositWorkerPayout,
      projectId: project._id,
      projectType: projectType,
      workerId: worker._id,
      customerId: project.customer,
      status: 'completed',
      description: `Initial deposit (25%) collected for ${projectType} project: ${project.projectName || 'N/A'}`,
      metadata: { milestone: 1, percentage: 25, type: 'deposit' },
      processedAt: new Date()
    });
    
    await depositTransaction.save();
    
    // Immediately release 60% of deposit (15% of total) to worker as starting advance
    const advanceTransaction = new Transaction({
      transactionType: 'milestone_release',
      amount: immediateAdvance + (depositPlatformFee * immediateAdvancePercent),
      platformFee: depositPlatformFee * immediateAdvancePercent,
      netAmount: immediateAdvance,
      projectId: project._id,
      projectType: projectType,
      workerId: worker._id,
      customerId: project.customer,
      status: 'completed',
      description: `Starting advance (15% of project) released to worker for ${projectType} project: ${project.projectName || 'N/A'}`,
      metadata: { milestone: 0, percentage: 15, type: 'starting_advance' },
      processedAt: new Date()
    });
    
    await advanceTransaction.save();
    
    // Update worker's balances
    worker.earnings.pendingBalance += heldForMilestone; // 10% held for milestone approval
    worker.earnings.availableBalance += immediateAdvance; // 15% available immediately
    worker.earnings.totalEarnings += immediateAdvance;
    
    // Update monthly/yearly earnings
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    if (worker.earnings.lastResetMonth !== currentMonth || worker.earnings.lastResetYear !== currentYear) {
      worker.earnings.monthlyEarnings = immediateAdvance;
      worker.earnings.lastResetMonth = currentMonth;
      if (worker.earnings.lastResetYear !== currentYear) {
        worker.earnings.yearlyEarnings = immediateAdvance;
        worker.earnings.lastResetYear = currentYear;
      } else {
        worker.earnings.yearlyEarnings += immediateAdvance;
      }
    } else {
      worker.earnings.monthlyEarnings += immediateAdvance;
      worker.earnings.yearlyEarnings += immediateAdvance;
    }
    
    await worker.save();
    
    res.json({
      success: true,
      message: 'Payment successful! Worker received 15% starting advance. Remaining 10% will be released when first milestone is approved.',
      data: {
        paymentDetails: project.paymentDetails,
        breakdown: breakdown,
        commissionRate: commissionRate,
        depositAmount: depositAmount,
        depositCollected: true,
        immediateAdvance: immediateAdvance,
        heldForFirstMilestone: heldForMilestone,
        nextPaymentDue: 'When Milestone 1 (25%) is approved - will release remaining deposit + next 25%'
      }
    });
    
  } catch (error) {
    console.error('Error initializing escrow:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize deposit',
      error: error.message 
    });
  }
};

// ============================================================================
// COLLECT MILESTONE PAYMENT (Customer confirms milestone payment)
// ============================================================================

const collectMilestonePayment = async (req, res) => {
  try {
    const { projectId, projectType, milestonePercentage } = req.body;
    
    if (!projectId || !projectType || !milestonePercentage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID, type, and milestone percentage are required' 
      });
    }
    
    // Get the project model based on type
    let Project;
    if (projectType === 'architect') {
      Project = ArchitectHiring;
    } else if (projectType === 'interior') {
      Project = DesignRequest;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid project type' 
      });
    }
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    if (!project.paymentDetails || project.paymentDetails.escrowStatus === 'not_initiated') {
      return res.status(400).json({ 
        success: false, 
        message: 'Escrow not initialized for this project' 
      });
    }
    
    // Find the milestone payment
    const milestonePayment = project.paymentDetails.milestonePayments.find(
      mp => mp.percentage === milestonePercentage
    );
    
    if (!milestonePayment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Milestone payment not found' 
      });
    }
    
    if (milestonePayment.paymentCollected) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment for this milestone has already been collected' 
      });
    }
    
    // Get the worker
    const worker = await Worker.findById(project.worker || project.workerId);
    
    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: 'Worker not found' 
      });
    }
    
    // Mark milestone as paid
    milestonePayment.paymentCollected = true;
    milestonePayment.paymentCollectedAt = new Date();
    
    // TODO: In production, integrate with payment gateway (Stripe/Razorpay)
    // For now, we're simulating successful payment
    
    // Create transaction for milestone payment collection
    const transaction = new Transaction({
      transactionType: 'escrow_hold',
      amount: milestonePayment.amount,
      platformFee: milestonePayment.platformFee,
      netAmount: milestonePayment.workerPayout,
      projectId: project._id,
      projectType: projectType,
      workerId: worker._id,
      customerId: project.customer || project.customerId,
      status: 'completed',
      description: `Milestone ${milestonePercentage}% payment collected from customer`,
      metadata: { 
        milestone: milestonePercentage,
        type: 'milestone_payment'
      },
      processedAt: new Date()
    });
    
    await transaction.save();
    
    // Add to worker's pending balance
    worker.earnings.pendingBalance += milestonePayment.workerPayout;
    await worker.save();
    
    await project.save();
    
    console.log(`✓ Milestone ${milestonePercentage}% payment collected: ₹${milestonePayment.amount}`);
    
    res.json({
      success: true,
      message: `Payment for ${milestonePercentage}% milestone collected successfully! Funds held in escrow until milestone is completed.`,
      data: {
        amount: milestonePayment.amount,
        platformFee: milestonePayment.platformFee,
        workerPayout: milestonePayment.workerPayout,
        milestonePercentage: milestonePercentage,
        transaction: transaction
      }
    });
    
  } catch (error) {
    console.error('Error collecting milestone payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to collect milestone payment',
      error: error.message 
    });
  }
};

// ============================================================================
// MILESTONE PAYMENT RELEASE (Called when milestone is approved)
// ============================================================================

/**
 * Collect payment for next milestone from customer
 * Called after approving current milestone
 */
const collectNextMilestonePayment = async (project, projectType, currentMilestoneIndex) => {
  try {
    const nextMilestoneIndex = currentMilestoneIndex + 1;
    const milestonePayments = project.paymentDetails.milestonePayments;
    
    // Check if there's a next milestone
    if (nextMilestoneIndex >= milestonePayments.length) {
      console.log('No more milestones to collect payment for');
      return { success: true, collected: false, message: 'No more milestones to collect' };
    }
    
    const nextMilestone = milestonePayments[nextMilestoneIndex];
    
    // Check if already paid
    if (nextMilestone.paymentCollected) {
      console.log(`Milestone ${nextMilestone.percentage}% already paid`);
      return { success: true, collected: false, message: 'Next milestone already paid' };
    }
    
    console.log(`Collecting payment for milestone ${nextMilestone.percentage}%...`);
    
    // TODO: In production, integrate with payment gateway (Stripe/Razorpay)
    // For now, we're automatically collecting (simulating successful payment)
    
    // Mark next milestone as paid
    nextMilestone.paymentCollected = true;
    nextMilestone.paymentCollectedAt = new Date();
    
    // Get worker for pending balance update
    const worker = await Worker.findById(project.worker || project.workerId);
    
    if (!worker) {
      console.error('Worker not found for payment collection');
      return { success: false, collected: false, message: 'Worker not found' };
    }
    
    // Create transaction for next milestone payment collection
    const transaction = new Transaction({
      transactionType: 'escrow_hold',
      amount: nextMilestone.amount,
      platformFee: nextMilestone.platformFee,
      netAmount: nextMilestone.workerPayout,
      projectId: project._id,
      projectType: projectType,
      workerId: worker._id,
      customerId: project.customer || project.customerId,
      status: 'completed',
      description: `Milestone ${nextMilestoneIndex + 1} (${nextMilestone.percentage}%) payment collected`,
      metadata: { 
        milestone: nextMilestoneIndex + 1, 
        percentage: nextMilestone.percentage,
        collectedAfterMilestone: currentMilestoneIndex + 1
      },
      processedAt: new Date()
    });
    
    await transaction.save();
    
    // Add to worker's pending balance
    worker.earnings.pendingBalance += nextMilestone.workerPayout;
    await worker.save();
    
    console.log(`✓ Payment collected for milestone ${nextMilestone.percentage}%: ₹${nextMilestone.amount}`);
    
    return { 
      success: true, 
      collected: true,
      amount: nextMilestone.amount,
      milestone: nextMilestone.percentage,
      message: `Payment for ${nextMilestone.percentage}% milestone collected successfully`
    };
    
  } catch (error) {
    console.error('Error collecting next milestone payment:', error);
    return { success: false, collected: false, error: error.message };
  }
};

/**
 * Release payment for an approved milestone
 * UPDATED: Now also triggers collection of next milestone payment
 */
const releaseMilestonePayment = async (req, res) => {
  try {
    const { projectId, projectType, milestonePercentage } = req.body;
    
    if (!projectId || !projectType || !milestonePercentage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID, type, and milestone percentage are required' 
      });
    }
    
    if (!MILESTONE_PERCENTAGES.includes(milestonePercentage)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid milestone percentage. Must be 25, 50, 75, or 100' 
      });
    }
    
    // Get the project model based on type
    let Project;
    if (projectType === 'architect') {
      Project = ArchitectHiring;
    } else if (projectType === 'interior') {
      Project = DesignRequest;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid project type' 
      });
    }
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    
    if (!project.paymentDetails || project.paymentDetails.escrowStatus === 'not_initiated') {
      return res.status(400).json({ 
        success: false, 
        message: 'Escrow not initialized for this project' 
      });
    }
    
    // Find the milestone payment index
    const milestoneIndex = project.paymentDetails.milestonePayments.findIndex(
      mp => mp.percentage === milestonePercentage
    );
    
    if (milestoneIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Milestone payment not found' 
      });
    }
    
    const milestonePayment = project.paymentDetails.milestonePayments[milestoneIndex];
    
    if (milestonePayment.status === 'released') {
      return res.status(400).json({ 
        success: false, 
        message: `Payment for ${milestonePercentage}% milestone has already been released. Move to the next milestone.` 
      });
    }
    
    // Check if customer has paid for this milestone
    if (!milestonePayment.paymentCollected) {
      return res.status(400).json({ 
        success: false, 
        message: `Customer has not paid for the ${milestonePercentage}% milestone yet. Payment collection is required before release.`
      });
    }
    
    // Get the worker
    const worker = await Worker.findById(project.worker);
    
    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: 'Worker not found' 
      });
    }
    
    // Reset periodic earnings if needed
    resetPeriodicEarnings(worker);
    
    // Update milestone payment status
    milestonePayment.status = 'released';
    milestonePayment.releasedAt = new Date();
    
    // Create milestone release transaction
    const transaction = new Transaction({
      transactionType: 'milestone_release',
      amount: milestonePayment.amount,
      platformFee: milestonePayment.platformFee,
      netAmount: milestonePayment.workerPayout,
      projectId: project._id,
      projectType: projectType,
      workerId: worker._id,
      customerId: project.customer,
      milestonePercentage: milestonePercentage,
      status: 'completed',
      description: `${milestonePercentage}% milestone payment released`,
      processedAt: new Date()
    });
    
    await transaction.save();
    
    // Link transaction to milestone
    milestonePayment.transactionId = transaction._id;
    
    // For first milestone (25%), only release the held portion (40% of 25% = 10%)
    // Because 60% was already released as starting advance
    let amountToRelease = milestonePayment.workerPayout;
    if (milestonePercentage === 25) {
      // Only 40% of first milestone is in pending (15% was released immediately)
      amountToRelease = milestonePayment.workerPayout * 0.4; // This is the 10% held portion
    }
    
    // Update worker balances
    worker.earnings.pendingBalance -= amountToRelease;
    worker.earnings.availableBalance += amountToRelease;
    worker.earnings.totalEarnings += amountToRelease;
    worker.earnings.monthlyEarnings += amountToRelease;
    worker.earnings.yearlyEarnings += amountToRelease;
    
    // Create platform commission transaction
    const commissionTransaction = new Transaction({
      transactionType: 'platform_commission',
      amount: milestonePayment.platformFee,
      platformFee: milestonePayment.platformFee,
      netAmount: 0,
      projectId: project._id,
      projectType: projectType,
      workerId: worker._id,
      customerId: project.customer,
      milestonePercentage: milestonePercentage,
      status: 'completed',
      description: `Platform commission for ${milestonePercentage}% milestone`,
      processedAt: new Date()
    });
    
    await commissionTransaction.save();
    
    // Update escrow status
    const allReleased = project.paymentDetails.milestonePayments.every(
      mp => mp.status === 'released' || mp.status === 'withdrawn'
    );
    
    if (allReleased) {
      project.paymentDetails.escrowStatus = 'fully_released';
    } else {
      project.paymentDetails.escrowStatus = 'partially_released';
    }
    
    await project.save();
    await worker.save();
    
    // Check if there's a next milestone (don't auto-collect, just inform)
    const nextMilestoneIndex = milestoneIndex + 1;
    const milestonePayments = project.paymentDetails.milestonePayments;
    let nextMilestoneInfo = null;
    
    if (nextMilestoneIndex < milestonePayments.length) {
      const nextMilestone = milestonePayments[nextMilestoneIndex];
      if (!nextMilestone.paymentCollected) {
        nextMilestoneInfo = {
          milestone: nextMilestone.percentage,
          amount: nextMilestone.amount,
          needsPayment: true
        };
      }
    }
    
    res.json({
      success: true,
      message: `Payment for ${milestonePercentage}% milestone released successfully`,
      data: {
        releasedAmount: milestonePayment.workerPayout,
        platformFee: milestonePayment.platformFee,
        newAvailableBalance: worker.earnings.availableBalance,
        escrowStatus: project.paymentDetails.escrowStatus,
        transaction: transaction,
        nextPayment: nextMilestoneInfo || { needsPayment: false }
      }
    });
    
  } catch (error) {
    console.error('Error releasing milestone payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to release milestone payment',
      error: error.message 
    });
  }
};

// ============================================================================
// WORKER EARNINGS & REVENUE
// ============================================================================

/**
 * Get worker's earnings summary
 */
const getWorkerEarnings = async (req, res) => {
  try {
    // Worker auth uses req.user.user_id
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }
    
    const workerId = req.user.user_id;
    
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: 'Worker not found' 
      });
    }
    
    // Reset periodic earnings if needed
    resetPeriodicEarnings(worker);
    await worker.save();
    
    // Get all transactions for this worker
    const transactions = await Transaction.find({ 
      workerId: workerId,
      status: 'completed'
    }).sort({ createdAt: -1 }).limit(20);
    
    // Get ongoing projects with payment details
    const architectProjects = await ArchitectHiring.find({
      worker: workerId,
      status: { $in: ['Accepted', 'Completed'] }
    }).select('projectName status paymentDetails createdAt');
    
    const interiorProjects = await DesignRequest.find({
      workerId: workerId,
      status: { $in: ['accepted', 'completed'] }
    }).select('projectName status paymentDetails createdAt');
    
    // Calculate project-wise earnings
    const projectEarnings = [];
    
    architectProjects.forEach(project => {
      if (project.paymentDetails && project.paymentDetails.milestonePayments) {
        const earned = project.paymentDetails.milestonePayments
          .filter(mp => mp.status === 'released' || mp.status === 'withdrawn')
          .reduce((sum, mp) => sum + mp.workerPayout, 0);
        
        const pending = project.paymentDetails.milestonePayments
          .filter(mp => mp.status === 'pending')
          .reduce((sum, mp) => sum + mp.workerPayout, 0);
        
        if (earned > 0 || pending > 0) {
          projectEarnings.push({
            projectId: project._id,
            projectName: project.projectName,
            projectType: 'architect',
            earned: earned,
            pending: pending,
            total: project.paymentDetails.totalAmount,
            status: project.status,
            createdAt: project.createdAt
          });
        }
      }
    });
    
    interiorProjects.forEach(project => {
      if (project.paymentDetails && project.paymentDetails.milestonePayments) {
        const earned = project.paymentDetails.milestonePayments
          .filter(mp => mp.status === 'released' || mp.status === 'withdrawn')
          .reduce((sum, mp) => sum + mp.workerPayout, 0);
        
        const pending = project.paymentDetails.milestonePayments
          .filter(mp => mp.status === 'pending')
          .reduce((sum, mp) => sum + mp.workerPayout, 0);
        
        if (earned > 0 || pending > 0) {
          projectEarnings.push({
            projectId: project._id,
            projectName: project.projectName,
            projectType: 'interior',
            earned: earned,
            pending: pending,
            total: project.paymentDetails.totalAmount,
            status: project.status,
            createdAt: project.createdAt
          });
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        earnings: worker.earnings,
        subscriptionPlan: worker.subscriptionPlan,
        commissionRate: worker.commissionRate,
        recentTransactions: transactions,
        projectEarnings: projectEarnings.sort((a, b) => b.createdAt - a.createdAt)
      }
    });
    
  } catch (error) {
    console.error('Error fetching worker earnings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch earnings',
      error: error.message 
    });
  }
};

/**
 * Request withdrawal of available balance
 */
const requestWithdrawal = async (req, res) => {
  try {
    // Worker auth uses req.user.user_id
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }
    
    const workerId = req.user.user_id;
    const { amount, bankDetails } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid withdrawal amount is required' 
      });
    }
    
    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Complete bank details are required' 
      });
    }
    
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({ 
        success: false, 
        message: 'Worker not found' 
      });
    }
    
    if (worker.earnings.availableBalance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. Available: ₹${worker.earnings.availableBalance}` 
      });
    }
    
    // Create withdrawal transaction
    const transaction = new Transaction({
      transactionType: 'worker_withdrawal',
      amount: amount,
      platformFee: 0,
      netAmount: amount,
      workerId: worker._id,
      status: 'pending',
      paymentMethod: 'bank_transfer',
      bankDetails: {
        accountHolderName: bankDetails.accountHolderName || worker.name,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        bankName: bankDetails.bankName
      },
      description: 'Withdrawal request to bank account',
      notes: `Requested by worker: ${worker.name}`
    });
    
    await transaction.save();
    
    // Update worker balance
    worker.earnings.availableBalance -= amount;
    worker.earnings.withdrawnAmount += amount;
    
    await worker.save();
    
    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully. Processing usually takes 2-3 business days.',
      data: {
        transaction: transaction,
        newAvailableBalance: worker.earnings.availableBalance,
        totalWithdrawn: worker.earnings.withdrawnAmount
      }
    });
    
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process withdrawal request',
      error: error.message 
    });
  }
};

/**
 * Get transaction history for worker
 */
const getTransactionHistory = async (req, res) => {
  try {
    // Worker auth uses req.user.user_id
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }
    
    const workerId = req.user.user_id;
    const { page = 1, limit = 20, type, status } = req.query;
    
    const query = { workerId: workerId };
    
    if (type) {
      query.transactionType = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Transaction.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        transactions: transactions,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalTransactions: count
      }
    });
    
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch transaction history',
      error: error.message 
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  initializeEscrow,
  collectMilestonePayment,
  releaseMilestonePayment,
  getWorkerEarnings,
  requestWithdrawal,
  getTransactionHistory,
  
  // Helper exports for use in other controllers
  calculatePaymentBreakdown,
  calculateMilestonePayments,
  COMMISSION_RATES,
  MILESTONE_PERCENTAGES
};
