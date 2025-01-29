import {
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateUserAvatar,
} from '../controllers/user.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';
import { Router } from 'express';

const userRouter = Router();
userRouter.route('/register').post(
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  registerUser,
);
userRouter.route('/login').post(loginUser);

//secured routes
userRouter.route('/logout').post(verifyJWT, logoutUser);
userRouter.route('/refresh-token').post(refreshAccessToken);

userRouter
  .route('/avatar')
  .put(verifyJWT, upload.single('avatar'), updateUserAvatar);

userRouter.route('/c/:username').get(verifyJWT, getUserChannelProfile);
userRouter.route('/history').get(verifyJWT, getWatchHistory);
export { userRouter };
