import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { userRouter } from './routes/user.route.js';

export const app = express();

//Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

//excepting json middleware instead of using body-parser
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

//routes
app.use('/api/v1/users', userRouter);
