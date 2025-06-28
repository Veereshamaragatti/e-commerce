import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import Razorpay from 'razorpay';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { createProductRouter } from './routes/product';
import { createPaymentRouter } from './routes/payments';

async function startServer() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        throw new Error("Supabase URL or Service Key is not defined in .env file");
    }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    console.log("Supabase client initialized.");

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay Key ID or Key Secret is not defined in .env file");
    }
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const app = express();
    app.use(cors());
    app.use(express.json());

    const productRouter = createProductRouter(supabase);
    const paymentRouter = createPaymentRouter(razorpay, supabase);
    
    app.use('/api/products', productRouter);
    app.use('/api/payments', paymentRouter);

    const PORT = 4242;
    app.listen(PORT, () => console.log(`Node server with Supabase listening on port ${PORT}`));
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
});