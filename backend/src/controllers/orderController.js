const Order = require('../models/Order');
const rateEngine = require('../services/rateEngine');

async function getQuote(req, res, next) {
  try {
    const { pickupPincode, dropPincode, length, width, height, actualWeight, orderType, paymentType } = req.body;
    
    const quote = await rateEngine.calculateQuote({
      pickupPincode, dropPincode, length, width, height, actualWeight, orderType, paymentType
    });
    
    return res.json({ quote });
  } catch (err) {
    if (err.message.includes('Service not available') || err.message.includes('No rate card found')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

async function createOrder(req, res, next) {
  try {
    const {
      pickupAddress, pickupPincode, dropAddress, dropPincode,
      length, width, height, actualWeight, orderType, paymentType
    } = req.body;

    const customerId = req.user.id; // From auth middleware

    const quote = await rateEngine.calculateQuote({
      pickupPincode, dropPincode, length, width, height, actualWeight, orderType, paymentType
    });

    const orderData = {
      customerId,
      pickupAddress, pickupPincode, pickupZoneId: quote.pickupZoneId,
      dropAddress, dropPincode, dropZoneId: quote.dropZoneId,
      length, width, height, actualWeight,
      volumetricWeight: quote.volumetricWeight,
      chargeableWeight: quote.chargeableWeight,
      orderType, paymentType,
      baseFee: quote.baseFee,
      perKgRate: quote.perKgRate,
      weightCharge: quote.weightCharge,
      codSurcharge: quote.codSurcharge,
      totalCharge: quote.totalCharge
    };

    const order = await Order.createOrder(orderData);
    await Order.addStatusHistory(order.id, 'Pending', customerId, 'Order created');

    return res.status(201).json({ message: 'Order created successfully', order });
  } catch (err) {
    if (err.message.includes('Service not available') || err.message.includes('No rate card found')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

async function listMyOrders(req, res, next) {
  try {
    const orders = await Order.getOrdersByCustomer(req.user.id);
    return res.json({ orders });
  } catch (err) {
    next(err);
  }
}

async function getOrderDetails(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.getOrderById(id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Customer can only view their own orders; admins/agents logic can be handled later
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    return res.json({ order });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQuote,
  createOrder,
  listMyOrders,
  getOrderDetails,
};
