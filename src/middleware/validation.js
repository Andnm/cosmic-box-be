const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const validateRegister = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Please provide a valid Vietnamese phone number'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateLetter = [
  body('content')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Letter content must be between 1 and 5000 characters')
    .trim(),
  handleValidationErrors
];

const validateConnectionRequest = [
  body('receiverId')
    .isMongoId()
    .withMessage('Valid receiver ID is required'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message must be less than 500 characters')
    .trim(),
  handleValidationErrors
];

const validateMessage = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters')
    .trim(),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateLetter,
  validateConnectionRequest,
  validateMessage,
  handleValidationErrors
};