import { DB_NAME } from '../constants.js';
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    );
    console.log(`\n Mongodb connected..`);
  } catch (error) {
    console.log('Mongodb connection error', error);
    process.exit(1);
  }
};
