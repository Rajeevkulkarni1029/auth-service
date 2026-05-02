import { Router } from 'express'
import {
  signup,
  signupWithTwoFactor,
  verifySignupTwoFactor,
  login,
  completeLoginWithTwoFactor,
  changePassword,
  setupTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  resetPassword,
  adminResetPassword,
  generateResetToken,
  resetPasswordWithToken
} from '../app/controllers/authController.js'
import verifyToken from '../middleware/verifyToken.js'

const router = Router()

router.post('/signup/', signup)
router.post('/signup-with-2fa/', signupWithTwoFactor)
router.post('/verify-signup-2fa/', verifySignupTwoFactor)
router.post('/login/', login)
router.post('/complete-login-2fa/', completeLoginWithTwoFactor)

router.post('/change-password/', verifyToken, changePassword)
router.post('/setup-two-factor/', verifyToken, setupTwoFactor)
router.post('/verify-two-factor/', verifyToken, verifyTwoFactor)
router.post('/disable-two-factor/', verifyToken, disableTwoFactor)

router.post('/reset-password/', resetPassword)
router.post('/admin-reset-password/', adminResetPassword)
router.post('/generate-reset-token/', generateResetToken)
router.post('/reset-password-with-token/', resetPasswordWithToken)

export default router
