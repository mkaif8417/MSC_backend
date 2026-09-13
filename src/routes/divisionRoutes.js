const express = require('express');
const router = express.Router();
const DivisionController = require('../controllers/DivisionController');

router.post('/', DivisionController.create);
router.get('/', DivisionController.getAll);
router.get('/:id', DivisionController.getById);
router.get('/:id/districts', DivisionController.getDistricts);
router.get('/by-state/:stateId/districts', DivisionController.getDistrictsByState);
router.put('/:id', DivisionController.update);
router.delete('/:id', DivisionController.delete);

module.exports = router;

// Mount this alongside your existing state/district/taluka routes so the
// final path is /locations/divisions — e.g. inside whatever file already
// mounts stateRoutes/districtRoutes under the "/locations" prefix, add:
//   router.use('/divisions', require('./divisionRoutes'));