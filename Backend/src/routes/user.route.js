import {
  loginUser,
  logoutUser,
  registerUser,
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
export { userRouter };
