import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { authRateLimiter } from '../../middlewares/rateLimiter';
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  verifyMfaValidator,
  disableMfaValidator,
  changePasswordValidator,
  updateProfileValidator,
} from './auth.validators';

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.post('/register', registerValidator, validate, authController.register);
router.post('/login', authRateLimiter, loginValidator, validate, authController.login);
router.post('/refresh', refreshTokenValidator, validate, authController.refreshToken);
router.post('/logout', authController.logout);

// SSO placeholders
router.get('/sso/google', authController.ssoCallback);
router.get('/sso/github', authController.ssoCallback);
router.get('/sso/gitlab', authController.ssoCallback);

// ─── Protected ────────────────────────────────────────────────────────────────
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, updateProfileValidator, validate, authController.updateProfile);
router.post('/change-password', authenticate, changePasswordValidator, validate, authController.changePassword);

// MFA
router.post('/mfa/setup', authenticate, authController.setupMfa);
router.post('/mfa/verify', authenticate, verifyMfaValidator, validate, authController.verifyAndEnableMfa);
router.post('/mfa/disable', authenticate, disableMfaValidator, validate, authController.disableMfa);

export default router;
