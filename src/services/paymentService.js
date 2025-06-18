const payOS = require('../config/payos');
const Payment = require('../models/Payment');
const crypto = require('crypto');

const createPaymentLink = async ({ requestId, userId, amount, description }) => {
  try {
    const orderCode = Date.now();
    
    const paymentData = {
      orderCode,
      amount,
      description,
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
      cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`
    };

    const paymentLinkResponse = await payOS.createPaymentLink(paymentData);

    const payment = new Payment({
      requestId,
      userId,
      amount,
      paymentMethod: 'bank',
      status: 'pending',
      payosOrderId: orderCode.toString(),
      payosData: paymentLinkResponse
    });

    await payment.save();

    return {
      paymentUrl: paymentLinkResponse.checkoutUrl,
      orderCode,
      paymentId: payment._id
    };
  } catch (error) {
    console.error('Payment link creation error:', error);
    throw new Error('Failed to create payment link');
  }
};

const verifyPayOSWebhook = (webhookData) => {
  try {
    const { signature, data } = webhookData;
    
    const sortedData = Object.keys(data)
      .sort()
      .reduce((result, key) => {
        result[key] = data[key];
        return result;
      }, {});

    const dataString = JSON.stringify(sortedData);
    const expectedSignature = crypto
      .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY)
      .update(dataString)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
};

const getPaymentInfo = async (orderCode) => {
  try {
    const paymentInfo = await payOS.getPaymentLinkInformation(orderCode);
    return paymentInfo;
  } catch (error) {
    console.error('Get payment info error:', error);
    throw new Error('Failed to get payment information');
  }
};

module.exports = {
  createPaymentLink,
  verifyPayOSWebhook,
  getPaymentInfo
};