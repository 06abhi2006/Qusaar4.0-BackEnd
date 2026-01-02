import { Request, Response } from 'express';
import { EmergencyService } from '../services/emergency.service';

export const EmergencyController = {
    async createCase(req: Request, res: Response) {
        try {
            const emergencyCase = await EmergencyService.createCase(req.body);
            res.status(201).json(emergencyCase);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    },

    async getActiveCases(_req: Request, res: Response) {
        try {
            const cases = await EmergencyService.getActiveCases();
            res.json(cases);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    async updateTriage(req: Request, res: Response) {
        try {
            const { level } = req.body;
            const updatedCase = await EmergencyService.updateTriageLevel(req.params.id, level);
            res.json(updatedCase);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    },

    async updateStatus(req: Request, res: Response) {
        try {
            const { status } = req.body;
            const updatedCase = await EmergencyService.updateStatus(req.params.id, status);
            res.json(updatedCase);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    },

    async assignProvider(req: Request, res: Response) {
        try {
            const { providerId } = req.body;
            const updatedCase = await EmergencyService.assignProvider(req.params.id, providerId);
            res.json(updatedCase);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
};
