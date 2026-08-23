const { query } = require('../config/db');
const RateCard = require('../models/RateCard');

async function getZoneIdByPincode(pincode) {
  const { rows } = await query(`SELECT zone_id FROM pincodes WHERE pincode = $1`, [pincode]);
  return rows[0] ? rows[0].zone_id : null;
}

async function calculateQuote(params) {
  const { pickupPincode, dropPincode, length, width, height, actualWeight, orderType, paymentType } = params;
  
  const pickupZoneId = await getZoneIdByPincode(pickupPincode);
  const dropZoneId = await getZoneIdByPincode(dropPincode);
  
  if (!pickupZoneId || !dropZoneId) {
    throw new Error('Service not available for the given pincodes');
  }

  const rateCard = await RateCard.getRateCard(pickupZoneId, dropZoneId, orderType);
  if (!rateCard) {
    throw new Error('No rate card found for this route and order type');
  }

  const volumetricWeight = (length * width * height) / 5000;
  const chargeableWeight = Math.max(actualWeight, volumetricWeight);
  
  const baseFee = parseFloat(rateCard.base_fee);
  const perKgRate = parseFloat(rateCard.per_kg_rate);
  const weightCharge = chargeableWeight * perKgRate;
  
  let codSurcharge = 0;
  if (paymentType === 'COD') {
    codSurcharge = await RateCard.getCodSurcharge(orderType);
  }
  
  const totalCharge = baseFee + weightCharge + codSurcharge;

  return {
    pickupZoneId,
    dropZoneId,
    volumetricWeight: parseFloat(volumetricWeight.toFixed(2)),
    chargeableWeight: parseFloat(chargeableWeight.toFixed(2)),
    baseFee,
    perKgRate,
    weightCharge: parseFloat(weightCharge.toFixed(2)),
    codSurcharge,
    totalCharge: parseFloat(totalCharge.toFixed(2))
  };
}

module.exports = {
  getZoneIdByPincode,
  calculateQuote
};
