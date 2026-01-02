import { Request, Response } from 'express';
import { OTService } from '../services/ot.service';

export const OTController = {
    async scheduleOperation(req: Request, res: Response) {
        try {
            const operation = await OTService.scheduleOperation(req.body);
            res.status(201).json(operation);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    },

    async getOperations(req: Request, res: Response) {
        try {
            const { date } = req.query;
            const operations = await OTService.getOperations(date as string);
            res.json(operations);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    async updateStatus(req: Request, res: Response) {
        try {
            const { status } = req.body;
            const operation = await OTService.updateStatus(req.params.id, status);
            res.json(operation);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
};
