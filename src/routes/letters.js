const express = require("express");
const router = express.Router();
const { authenticateToken, requireUser } = require("../middleware/auth");
const { validateLetter } = require("../middleware/validation");
const {
  createLetter,
  getMyLetters,
  getReceivedLetters,
  archiveLetter,
  deleteDraftLetter,
} = require("../controllers/letterController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Letter:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         senderId:
 *           type: string
 *         receiverId:
 *           type: string
 *         content:
 *           type: string
 *         status:
 *           type: string
 *           enum: [draft, sent, archived]
 *         adminReviewStatus:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         adminReviewedAt:
 *           type: string
 *           format: date-time
 *         adminReviewNote:
 *           type: string
 *         sentAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/letters:
 *   post:
 *     summary: Create a new letter
 *     tags: [Letters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *               status:
 *                 type: string
 *                 enum: [draft, sent, archived]
 *                 description: Letter status (defaults to 'draft' if not provided)
 *     responses:
 *       201:
 *         description: Letter created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", authenticateToken, requireUser, validateLetter, createLetter);

/**
 * @swagger
 * /api/letters/my:
 *   get:
 *     summary: Get my letters
 *     tags: [Letters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, archived]
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
 *         description: Letters retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/my", authenticateToken, requireUser, getMyLetters);

/**
 * @swagger
 * /api/letters/received:
 *   get:
 *     summary: Get received letters
 *     tags: [Letters]
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
 *         description: Received letters retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/received", authenticateToken, requireUser, getReceivedLetters);

/**
 * @swagger
 * /api/letters/{letterId}/archive:
 *   put:
 *     summary: Archive a letter
 *     tags: [Letters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: letterId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Letter archived successfully
 *       404:
 *         description: Letter not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:letterId/archive", authenticateToken, requireUser, archiveLetter);

/**
 * @swagger
 * /api/letters/{letterId}:
 *   delete:
 *     summary: Delete draft letter
 *     tags: [Letters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: letterId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Draft letter deleted successfully
 *       404:
 *         description: Draft letter not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:letterId", authenticateToken, requireUser, deleteDraftLetter);

module.exports = router;
