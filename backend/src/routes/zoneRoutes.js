const express = require('express');
const router = express.Router();

const zoneController = require('../controllers/zoneController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  zoneRules,
  pincodeRules,
  handleValidation,
} = require('../utils/validators');

// All zone routes are admin-only
router.use(authenticate, authorize('admin'));

router.post('/', zoneRules, handleValidation, zoneController.createZone);
router.get('/', zoneController.listZones);
router.delete('/:id', zoneController.deleteZone);

router.post('/:id/pincodes', pincodeRules, handleValidation, zoneController.addPincode);
router.delete('/pincodes/:pincode', zoneController.removePincode);
router.get('/:id/pincodes', zoneController.listPincodes);

module.exports = router;
