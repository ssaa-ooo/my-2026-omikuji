const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['paypay', 'card'],
      line_items: [{
        price_data: {
          currency: 'jpy',
          product_data: { name: '二〇二六年 本格おみくじ' },
          unit_amount: 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      // 成功後に戻るURL（セッションIDを付与）
      success_url: `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};