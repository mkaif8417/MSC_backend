const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requirePermissions } = require('../middlewares/rbac.middleware'); // adjust path if yours differs
const validate = require('../middlewares/validate.middleware');
const { PERMISSIONS } = require('../constants/permissions');
const topicController = require('../controllers/topic.controller');
const {
  createTopicSchema,
  updateTopicSchema,
  lookupTopicQuerySchema,
  objectIdParamSchema
} = require('../middlewares/topic.validator')

router.use(authenticate);

router.post('/', requirePermissions(PERMISSIONS.TOPIC_MANAGE), validate({ body: createTopicSchema }), topicController.createTopic);
router.get('/lookup', requirePermissions(PERMISSIONS.ACADEMIC_READ), validate({ query: lookupTopicQuerySchema }), topicController.lookupTopic);
router.get('/', requirePermissions(PERMISSIONS.ACADEMIC_READ), topicController.getTopicsByClassSubject);
router.patch('/:id', requirePermissions(PERMISSIONS.TOPIC_MANAGE), validate({ params: objectIdParamSchema, body: updateTopicSchema }), topicController.updateTopic);
router.delete('/:id', requirePermissions(PERMISSIONS.TOPIC_MANAGE), validate({ params: objectIdParamSchema }), topicController.deleteTopic);

module.exports = router;