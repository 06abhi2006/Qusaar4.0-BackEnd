import { Router } from 'express';
import { LabController } from '../controllers/lab.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// --- Test Catalog ---
// View: Everyone appropriate
router.get('/tests', requireRole('admin', 'doctor', 'lab_technician', 'receptionist'), LabController.getTests);
// Manage: Admin, Lab Tech
router.post('/tests', requireRole('admin', 'lab_technician'), LabController.createTest);

// --- Lab Requests ---
// View: Admin, Doctor, Lab Tech
router.get('/requests', requireRole('admin', 'doctor', 'lab_technician'), LabController.getRequests);
// Create: Doctor
router.post('/requests', requireRole('admin', 'doctor'), LabController.createRequest);
// Update Result: Lab Tech
router.put('/requests/:id/result', requireRole('admin', 'lab_technician'), LabController.updateResult);

export default router;
