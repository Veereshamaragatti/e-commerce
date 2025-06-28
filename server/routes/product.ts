import { Router, Request, Response } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';

export const createProductRouter = (supabase: SupabaseClient) => {
    const router = Router();

    router.get('/', async (req: Request, res: Response) => {
        try {
            const { data, error } = await supabase.from('products').select('*');
            if (error) throw error;
            res.json(data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            res.status(500).json({ error: 'Failed to fetch products from database' });
        }
    });

    return router;
};