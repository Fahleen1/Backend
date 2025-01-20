import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

export const app = express();

//Middlewares
app.use(cors());
