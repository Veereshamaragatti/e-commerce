import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';

export const createPaymentRouter = (razorpay: Razorpay, supabase: SupabaseClient) => {
    const router = Router();

    router.post('/create-order', async (req: Request, res: Response) => {
        const { productId } = req.body;

        const { data: product, error: productError } = await supabase
            .from('products').select('price_in_cents').eq('id', productId).single();
        
        if (productError || !product) {
            res.status(404).json({ error: "Product not found." });
            return;
        }

        const options = {
            amount: product.price_in_cents,
            currency: "INR",
            receipt: `receipt_order_${new Date().getTime()}`,
        };

        try {
            const razorpayOrder = await razorpay.orders.create(options);

            // --- THE FIX IS HERE ---
            // We are now inserting into 'amount_in_cents', which matches the simpler DB schema.
            const { error: insertError } = await supabase.from('orders').insert({
                product_id: productId,
                razorpay_order_id: razorpayOrder.id,
                status: 'pending',
                amount_in_cents: product.price_in_cents, // Correct column name
            });
            // --- END OF FIX ---

            if (insertError) {
                console.error("Supabase insert error:", insertError);
                res.status(500).json({ error: "Failed to create order record in database." });
                return;
            }
            
            res.status(200).json(razorpayOrder);

        } catch (razorpayError) {
            console.error("Error creating Razorpay order:", razorpayError);
            res.status(500).json({ error: "Failed to communicate with payment provider." });
        }
    });

    router.post('/verify-payment', async (req: Request, res: Response) => {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        console.log("Received payment verification request:", { razorpay_order_id, razorpay_payment_id, razorpay_signature });
        const key_secret = process.env.RAZORPAY_KEY_SECRET!;

        // Handle payment cancellation case - when only order_id is provided
        if (razorpay_order_id && !razorpay_payment_id && !razorpay_signature) {
            console.log("Processing payment cancellation for order:", razorpay_order_id);
            const { error } = await supabase.from('orders').update({
                status: 'cancelled'
            }).eq('razorpay_order_id', razorpay_order_id);

            if (error) {
                console.error("Error updating cancelled order:", error);
                res.status(500).json({ success: false, message: "Error updating cancelled order in database." });
                return;
            }
            res.json({ success: true, message: "Order cancelled successfully." });
            return;
        }

        if (!razorpay_payment_id || !razorpay_signature || !razorpay_order_id) {
            res.status(400).json({ success: false, message: "Payment details incomplete." });
            return;
        }
        
        const hmac = crypto.createHmac('sha256', key_secret);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generated_signature = hmac.digest('hex');

        if (generated_signature === razorpay_signature) {
            const { error } = await supabase.from('orders').update({
                    status: 'succeeded',
                    razorpay_payment_id: razorpay_payment_id,
                    razorpay_signature: razorpay_signature,
                }).eq('razorpay_order_id', razorpay_order_id);

            if (error) {
                res.status(500).json({ success: false, message: "Error updating order in database." });
                return;
            }
            res.json({ success: true, message: "Payment has been verified." });
        } else {
            res.status(400).json({ success: false, message: "Payment verification failed." });
        }
    });

    // Debug endpoint to check order status
    router.get('/order-status/:orderId', async (req: Request, res: Response) => {
        const { orderId } = req.params;
        
        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('razorpay_order_id', orderId)
            .single();
            
        if (error || !order) {
            res.status(404).json({ error: "Order not found." });
            return;
        }
        
        res.json(order);
    });

    // Dedicated endpoint for payment cancellation
    router.post('/cancel-payment', async (req: Request, res: Response) => {
        const { razorpay_order_id } = req.body;
        console.log("Processing payment cancellation for order:", razorpay_order_id);
        
        if (!razorpay_order_id) {
            res.status(400).json({ success: false, message: "Order ID is required for cancellation." });
            return;
        }

        const { error } = await supabase.from('orders').update({
            status: 'cancelled'
        }).eq('razorpay_order_id', razorpay_order_id);

        if (error) {
            console.error("Error updating cancelled order:", error);
            res.status(500).json({ success: false, message: "Error updating cancelled order in database." });
            return;
        }
        
        res.json({ success: true, message: "Order cancelled successfully." });
    });

    return router;
};