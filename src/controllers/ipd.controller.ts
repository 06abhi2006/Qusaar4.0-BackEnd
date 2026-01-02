import { Request, Response } from 'express';
import { IPDService } from '../services/ipd.service';

export const IPDController = {
    // --- Wards & Beds ---
    async getAllWards(_req: Request, res: Response) {
        try {
            const wards = await IPDService.getAllWards();
            res.json(wards);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    async createWard(req: Request, res: Response) {
        try {
            const ward = await IPDService.createWard(req.body);
            res.status(201).json(ward);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    },

    async getWardById(req: Request, res: Response) {
        try {
            const ward = await IPDService.getWardById(req.params.id);
            if (!ward) {
                res.status(404).json({ message: 'Ward not found' });
                return;
            }
            res.json(ward);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    // --- Admissions ---
    async admitPatient(req: Request, res: Response) {
        try {
            const admission = await IPDService.admitPatient(req.body);
            res.status(201).json(admission);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    },

    async dischargePatient(req: Request, res: Response) {
        try {
            const admission = await IPDService.dischargePatient(req.params.id);
            res.json(admission);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    },

    async getActiveAdmissions(_req: Request, res: Response) {
        try {
            const admissions = await IPDService.getActiveAdmissions();
            res.json(admissions);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
};
