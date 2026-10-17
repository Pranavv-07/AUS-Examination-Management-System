import { Router, Request, Response } from 'express';
import {
  UserModel,
  StudentModel,
  FacultyModel,
  RoomModel,
  ExaminationModel,
  AuditLogModel,
} from './models';
import { getDatabaseStatus } from './db';

export const apiRouter = Router();

// DB Health Check
apiRouter.get('/health', (req: Request, res: Response) => {
  const status = getDatabaseStatus();
  res.json({
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    institution: 'ADITYA UNIVERSITY — SURAMPALEM',
    database: status,
  });
});

// Authentication
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const u = username.toLowerCase().trim();
  if ((u === 'admin' && password === 'admin123') || (u === 'examiner' && password === 'examiner123')) {
    const role = u === 'admin' ? 'ADMIN' : 'EXAMINER';
    const user = {
      id: `usr_${u}`,
      username: u,
      name: u === 'admin' ? 'Chief Controller of Examinations' : 'Dr. Examination Officer',
      role,
      email: `${u}@adityauniversity.in`,
      department: 'Examination Cell',
      isActive: true,
    };
    return res.json({ success: true, user });
  }

  return res.status(401).json({ error: 'Invalid university credentials' });
});

// Students API
apiRouter.get('/students', async (req: Request, res: Response) => {
  try {
    const students = await StudentModel.find().limit(200);
    res.json(students);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

apiRouter.post('/students', async (req: Request, res: Response) => {
  try {
    const student = new StudentModel(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// Faculty API
apiRouter.get('/faculty', async (req: Request, res: Response) => {
  try {
    const faculty = await FacultyModel.find().limit(100);
    res.json(faculty);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Rooms API
apiRouter.get('/rooms', async (req: Request, res: Response) => {
  try {
    const rooms = await RoomModel.find();
    res.json(rooms);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Examinations API
apiRouter.get('/examinations', async (req: Request, res: Response) => {
  try {
    const exams = await ExaminationModel.find();
    res.json(exams);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Audit Logs
apiRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const logs = await AuditLogModel.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});
