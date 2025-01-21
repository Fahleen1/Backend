import { registerUser } from '../controllers/user.controller.js';
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

export { userRouter };
