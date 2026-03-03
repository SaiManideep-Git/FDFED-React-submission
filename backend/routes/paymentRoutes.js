const express = require('express');
const router = express.Router();
const authWorker = require('../middlewares/auth');
const paymentController = require('../controllers/paymentController');

// ============================================================================
// PAYMENT & ESCROW ROUTES
// ============================================================================

/**
 * @route   POST /api/payment/initialize-escrow
 * @desc    Initialize escrow when customer accepts proposal
 * @access  Private (Customer or Admin)
 * @body    { projectId, projectType }
 */
router.post('/initialize-escrow', paymentController.initializeEscrow);

/**
 * @route   POST /api/payment/collect-milestone
 * @desc    Collect payment from customer for a milestone
 * @access  Private (Customer)
 * @body    { projectId, projectType, milestonePercentage }
 */
router.post('/collect-milestone', paymentController.collectMilestonePayment);

/**
 * @route   POST /api/payment/release-milestone
 * @desc    Release payment for an approved milestone
 * @access  Private (Customer or Admin)
 * @body    { projectId, projectType, milestonePercentage }
 */
router.post('/release-milestone', paymentController.releaseMilestonePayment);

// ============================================================================
// WORKER EARNINGS & REVENUE ROUTES
// ============================================================================

/**
 * @route   GET /api/payment/worker/earnings
 * @desc    Get worker's earnings summary and revenue breakdown
 * @access  Private (Worker only)
 */
router.get('/worker/earnings', authWorker, paymentController.getWorkerEarnings);

/**
 * @route   POST /api/payment/worker/withdraw
 * @desc    Request withdrawal of available balance to bank account
 * @access  Private (Worker only)
 * @body    { amount, bankDetails }
 */
router.post('/worker/withdraw', authWorker, paymentController.requestWithdrawal);

/**
 * @route   GET /api/payment/worker/transactions
 * @desc    Get transaction history for worker
 * @access  Private (Worker only)
 * @query   ?page=1&limit=20&type=milestone_release&status=completed
 */
router.get('/worker/transactions', authWorker, paymentController.getTransactionHistory);

module.exports = router;
