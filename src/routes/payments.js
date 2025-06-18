const express = require('express');
const router = express.Router();
const { authenticateToken, requireUser } = require('../middleware/auth');
const {
  getPaymentStatus,
  handlePayOSWebhook,
  getMyPayments
} = require('../controllers/paymentController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         requestId:
 *           type: string
 *         userId:
 *           type: string
 *         amount:
 *           type: number
 *         paymentMethod:
 *           type: string
 *           enum: [bank, momo, zalopay, vnpay]
 *         transactionCode:
 *           type: string
 *         paidAt:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [pending, completed, failed]
 *         payosOrderId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get my payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed]
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, requireUser, getMyPayments);

/**
 * @swagger
 * /api/payments/request/{requestId}/status:
 *   get:
 *     summary: Get payment status for connection request
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *       404:
 *         description: Payment not found
 *       401:
 *         description: Unauthorized
 */
router.get('/request/:requestId/status', authenticateToken, requireUser, getPaymentStatus);

/**
 * @swagger
 * /api/payments/webhook/payos:
 *   post:
 *     summary: PayOS webhook handler
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 *       404:
 *         description: Payment not found
 */
router.post('/webhook/payos', handlePayOSWebhook);

module.exports = router;