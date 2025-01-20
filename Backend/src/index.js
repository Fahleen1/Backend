import dotenv from 'dotenv';

import { app } from './app.js';
import connectDB from './db/index.js';

dotenv.config({ path: '../.env' });

connectDB().then(() => {
  app.listen(process.env.PORT || 3002, () => {
    console.log(`App is listening on ${process.env.PORT}`);
  });
});
