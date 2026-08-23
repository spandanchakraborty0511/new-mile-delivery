const Zone = require('../models/Zone');

async function createZone(req, res, next) {
  try {
    const { name } = req.body;
    const zone = await Zone.createZone(name);
    return res.status(201).json({ message: 'Zone created successfully', zone });
  } catch (err) {
    if (err.code === '23505') { // Postgres unique violation
      return res.status(409).json({ error: 'Zone with this name already exists' });
    }
    next(err);
  }
}

async function listZones(req, res, next) {
  try {
    const zones = await Zone.listZones();
    return res.json({ zones });
  } catch (err) {
    next(err);
  }
}

async function deleteZone(req, res, next) {
  try {
    const { id } = req.params;
    const success = await Zone.deleteZone(id);
    if (!success) {
      return res.status(404).json({ error: 'Zone not found' });
    }
    return res.json({ message: 'Zone deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function addPincode(req, res, next) {
  try {
    const { id } = req.params;
    const { pincode } = req.body;
    
    const zone = await Zone.getZoneById(id);
    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const mapping = await Zone.addPincodeToZone(id, pincode);
    return res.status(200).json({ message: 'Pincode added to zone', mapping });
  } catch (err) {
    next(err);
  }
}

async function removePincode(req, res, next) {
  try {
    const { pincode } = req.params;
    const success = await Zone.removePincode(pincode);
    if (!success) {
      return res.status(404).json({ error: 'Pincode mapping not found' });
    }
    return res.json({ message: 'Pincode removed from zone' });
  } catch (err) {
    next(err);
  }
}

async function listPincodes(req, res, next) {
  try {
    const { id } = req.params;
    const pincodes = await Zone.listPincodesByZone(id);
    return res.json({ pincodes });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createZone,
  listZones,
  deleteZone,
  addPincode,
  removePincode,
  listPincodes,
};
