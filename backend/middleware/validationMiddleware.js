const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

const registerRules = [
  body('email').isEmail().withMessage('유효한 이메일을 입력해주세요.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('비밀번호는 6자 이상이어야 합니다.').trim(),
  body('name').notEmpty().withMessage('이름을 입력해주세요.').trim().escape(),
];

const loginRules = [
  body('email').isEmail().withMessage('유효한 이메일을 입력해주세요.').normalizeEmail(),
  body('password').notEmpty().withMessage('비밀번호를 입력해주세요.').trim(),
];

const commentRules = [
  body('content').notEmpty().withMessage('댓글 내용을 입력해주세요.').trim().escape(),
];

const paymentRules = [
  body('courseId').isInt({ min: 1 }).withMessage('유효한 강의 ID가 필요합니다.'),
  body('amount').isInt({ min: 0 }).withMessage('결제 금액이 유효하지 않습니다.'),
  body('paymentMethod').notEmpty().withMessage('결제 수단을 선택해주세요.').trim().escape(),
  body('cardLast4').matches(/^\d{4}$/).withMessage('카드 번호 끝 4자리를 입력해주세요.'),
];

module.exports = { validate, registerRules, loginRules, commentRules, paymentRules };
