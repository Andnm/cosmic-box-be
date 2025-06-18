const express = require('express');
const router = express.Router();
const { authenticateToken, requireUser } = require('../middleware/auth');
const { validateConnectionRequest } = require('../middleware/validation');
const {
  getUsers,
  createConnectionRequest,
  getMyConnectionRequests,
  respondToConnectionRequest
} = require('../controllers/connectionController');

/**
 * @swagger
 * components:
 *   schemas:
 *     ConnectionRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         senderId:
 *           type: string
 *         receiverId:
 *           type: string
 *         message:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *         feeAmount:
 *           type: number
 *         isPaid:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/connections/users:
 *   get:
 *     summary: Get list of users for connection
 *     tags: [Connections]
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
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/users', authenticateToken, requireUser, getUsers);

/**
 * @swagger
 * /api/connections/requests:
 *   post:
 *     summary: Create connection request
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: string
 *               message:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Connection request created successfully
 *       400:
 *         description: Validation error or request already exists
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.post('/requests', authenticateToken, requireUser, validateConnectionRequest, createConnectionRequest);

/**
 * @swagger
 * /api/connections/requests:
 *   get:
 *     summary: Get my connection requests
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sent, received]
 *           default: sent
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
 *         description: Connection requests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/requests', authenticateToken, requireUser, getMyConnectionRequests);

/**
 * @swagger
 * /api/connections/requests/{requestId}/respond:
 *   put:
 *     summary: Respond to connection request
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *     responses:
 *       200:
 *         description: Connection request responded successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Connection request not found or not paid
 *       401:
 *         description: Unauthorized
 */
router.put('/requests/:requestId/respond', authenticateToken, requireUser, respondToConnectionRequest);

module.exports = router;