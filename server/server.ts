import express from 'express';
import dotenv from 'dotenv';
import { connectToDatabase } from './db';
import { apiRouter } from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS & Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Mount API routes
app.use('/api', apiRouter);

// Start server
async function startServer() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Aditya University Exam Management Server listening on port ${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
  });
}

export default app;
