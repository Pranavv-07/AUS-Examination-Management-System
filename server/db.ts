import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://au_exam_user:AdityaExam2026@cluster0.mongodb.net/aditya_exam_portal?retryWrites=true&w=majority';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'aditya_exam_portal';

let isConnected = false;

export async function connectToDatabase(): Promise<boolean> {
  if (isConnected) return true;

  try {
    console.log(`Connecting to MongoDB Atlas database: ${MONGODB_DATABASE}...`);
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DATABASE,
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    isConnected = true;
    console.log('Successfully connected to MongoDB Atlas database.');
    return true;
  } catch (error) {
    console.warn('MongoDB Atlas connection failed or offline:', (error as Error).message);
    return false;
  }
}

export function getDatabaseStatus(): { isConnected: boolean; database: string } {
  return {
    isConnected: mongoose.connection.readyState === 1,
    database: MONGODB_DATABASE,
  };
}
