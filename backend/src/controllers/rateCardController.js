const RateCard = require('../models/RateCard');

async function setRateCard(req, res, next) {
  try {
    const { sourceZoneId, destinationZoneId, orderType, baseFee, perKgRate } = req.body;
    
    if (orderType !== 'B2B' && orderType !== 'B2C') {
      return res.status(400).json({ error: 'orderType must be B2B or B2C' });
    }

    const rateCard = await RateCard.setRateCard(sourceZoneId, destinationZoneId, orderType, baseFee, perKgRate);
    return res.status(200).json({ message: 'Rate card saved successfully', rateCard });
  } catch (err) {
    if (err.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Invalid zone ID provided' });
    }
    next(err);
  }
}

async function listRateCards(req, res, next) {
  try {
    const rateCards = await RateCard.listRateCards();
    return res.json({ rateCards });
  } catch (err) {
    next(err);
  }
}

async function deleteRateCard(req, res, next) {
  try {
    const { id } = req.params;
    const success = await RateCard.deleteRateCard(id);
    if (!success) {
      return res.status(404).json({ error: 'Rate card not found' });
    }
    return res.json({ message: 'Rate card deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function setCodSurcharge(req, res, next) {
  try {
    const { orderType, surchargeAmount } = req.body;
    
    if (orderType !== 'B2B' && orderType !== 'B2C') {
      return res.status(400).json({ error: 'orderType must be B2B or B2C' });
    }

    const codSurcharge = await RateCard.setCodSurcharge(orderType, surchargeAmount);
    return res.status(200).json({ message: 'COD surcharge updated successfully', codSurcharge });
  } catch (err) {
    next(err);
  }
}

async function listCodSurcharges(req, res, next) {
  try {
    const codSurcharges = await RateCard.listCodSurcharges();
    return res.json({ codSurcharges });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  setRateCard,
  listRateCards,
  deleteRateCard,
  setCodSurcharge,
  listCodSurcharges,
};
