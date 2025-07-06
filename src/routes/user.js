const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserProfile,
  upgradeToVip,
  getMembershipStatus,
  getPaymentHistory
} = require('../controllers/userController');

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     roleName:
 *                       type: string
 *                       enum: [user, admin]
 *                     membership:
 *                       type: string
 *                       enum: [basic, vip]
 *                     membershipExpiry:
 *                       type: string
 *                       format: date-time
 *                     isVipActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', authenticateToken, getUserProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Username already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/profile', authenticateToken, updateUserProfile);

/**
 * @swagger
 * /api/users/upgrade-vip:
 *   post:
 *     summary: Create payment link for VIP upgrade
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: VIP upgrade payment link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 paymentLink:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 description:
 *                   type: string
 *       400:
 *         description: User is already VIP member
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/upgrade-vip', authenticateToken, upgradeToVip);

/**
 * @swagger
 * /api/users/membership:
 *   get:
 *     summary: Get membership status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Membership status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 membership:
 *                   type: string
 *                   enum: [basic, vip]
 *                 membershipExpiry:
 *                   type: string
 *                   format: date-time
 *                 isVipActive:
 *                   type: boolean
 *                 daysRemaining:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/membership', authenticateToken, getMembershipStatus);

/**
 * @swagger
 * /api/users/payment-history:
 *   get:
 *     summary: Get VIP payment history
 *     tags: [Users]
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
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalPages:
 *                   type: number
 *                 currentPage:
 *                   type: number
 *                 total:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/payment-history', authenticateToken, getPaymentHistory);

module.exports = router;