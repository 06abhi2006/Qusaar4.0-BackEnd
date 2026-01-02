import { Request, Response } from 'express';
import { InsuranceService } from '../services/insurance.service';
import { ClaimStatus } from '@prisma/client';

export const InsuranceController = {
    // --- Policies ---
    async getPolicies(req: Request, res: Response) {
        try {
            const patientId = req.query.patientId as string;
            const policies = await InsuranceService.getPolicies(patientId);
            res.json(policies);
        } catch (error: any) {
            res.status(500).json({ message: error.message || 'Failed to fetch policies' });
        }
    },

    async addPolicy(req: Request, res: Response) {
        try {
            const policy = await InsuranceService.addPolicy(req.body);
            res.status(201).json(policy);
        } catch (error: any) {
            res.status(400).json({ message: error.message || 'Failed to add policy' });
        }
    },

    // --- Claims ---
    async getClaims(req: Request, res: Response) {
        try {
            const status = req.query.status as ClaimStatus;
            const claims = await InsuranceService.getClaims(status);
            res.json(claims);
        } catch (error: any) {
            res.status(500).json({ message: error.message || 'Failed to fetch claims' });
        }
    },

    async submitClaim(req: Request, res: Response) {
        try {
            const claim = await InsuranceService.submitClaim(req.body);
            res.status(201).json(claim);
        } catch (error: any) {
            res.status(400).json({ message: error.message || 'Failed to submit claim' });
        }
    },

    async processClaim(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const claim = await InsuranceService.processClaim(id, req.body);
            res.json(claim);
        } catch (error: any) {
            res.status(400).json({ message: error.message || 'Failed to process claim' });
        }
    }
};
