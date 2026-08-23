const express = require('express');
const router = express.Router();

const rateCardController = require('../controllers/rateCardController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  rateCardRules,
  codSurchargeRules,
  handleValidation,
} = require('../utils/validators');

// All rate card routes are admin-only
router.use(authenticate, authorize('admin'));

router.post('/', rateCardRules, handleValidation, rateCardController.setRateCard);
router.get('/', rateCardController.listRateCards);
router.delete('/:id', rateCardController.deleteRateCard);

router.post('/cod-surcharge', codSurchargeRules, handleValidation, rateCardController.setCodSurcharge);
router.get('/cod-surcharge', rateCardController.listCodSurcharges);

module.exports = router;
