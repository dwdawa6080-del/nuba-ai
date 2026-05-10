const express         = require('express');
const router          = express.Router();
const auth            = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const ctrl            = require('../controllers/tenantController');

router.post('/',                           auth, ctrl.createTenant);
router.get('/',                            auth, ctrl.getMyTenants);
router.get('/:slug',                       auth, tenantMiddleware, ctrl.getTenant);
router.put('/:slug',                       auth, tenantMiddleware, ctrl.updateTenant);
router.post('/:slug/members',              auth, tenantMiddleware, ctrl.addMember);
router.delete('/:slug/members/:memberId',  auth, tenantMiddleware, ctrl.removeMember);

module.exports = router;
