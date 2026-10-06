import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendCreated } from '../../utils/apiResponse';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await authService.register(req.body);
      sendCreated(res, tokens, 'Registration successful');
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body, req.ip);

      if ('mfaRequired' in result) {
        // Return partial response indicating MFA is needed
        res.status(200).json({
          success: true,
          message: 'MFA verification required',
          data: { mfaRequired: true, userId: result.userId },
        });
        return;
      }

      sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      sendSuccess(res, result, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.id);
      sendSuccess(res, user, 'Profile retrieved');
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.updateProfile(req.user!.id, req.body);
      sendSuccess(res, user, 'Profile updated');
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.id, currentPassword, newPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  },

  async setupMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.setupMfa(req.user!.id);
      sendSuccess(res, result, 'MFA setup initiated. Scan the QR code with your authenticator app.');
    } catch (err) {
      next(err);
    }
  },

  async verifyAndEnableMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.verifyAndEnableMfa(req.user!.id, req.body.totpCode);
      sendSuccess(res, null, 'MFA enabled successfully');
    } catch (err) {
      next(err);
    }
  },

  async disableMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.disableMfa(req.user!.id, req.body.password);
      sendSuccess(res, null, 'MFA disabled successfully');
    } catch (err) {
      next(err);
    }
  },

  /** SSO callback placeholder — to be implemented with Passport.js / Keycloak */
  async ssoCallback(req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'SSO integration placeholder — connect with Google/GitHub OAuth in Phase 2',
    });
  },
};
