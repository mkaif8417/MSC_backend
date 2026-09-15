const Joi = require('joi');
const objectIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

const subjectEntrySchema = Joi.object({
  subject: Joi.string().valid('Maths', 'Urdu', 'English').required(),
  hw: Joi.number().min(0).allow(null),
  cw: Joi.number().min(0).allow(null),
  grade: Joi.string().trim().allow(null, ''),
  pageNumber: Joi.number().integer().min(1).allow(null)
  // topic intentionally NOT accepted from client — service stamps it from Topic collection
});

const createSheetSchema = Joi.object({
  studentId: Joi.string().hex().length(24).required(),
  weekStartDate: Joi.date().required(),
  weekEndDate: Joi.date().required()
});

const addDailyEntrySchema = Joi.object({
  date: Joi.date().required(),
  day: Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun').required(),
  status: Joi.string().valid('Regular', 'Absent', 'Holiday', 'Program', 'WeeklyOff').default('Regular'),
  note: Joi.string().trim().allow(null, ''),
  subjects: Joi.array().items(subjectEntrySchema).length(3).required() // all 3 subjects, submitted together
});

const updateWeeklyResultSchema = Joi.object({
  weeklyResult: Joi.array()
    .items(
      Joi.object({
        subject: Joi.string().valid('Maths', 'Urdu', 'English').required(),
        totalMarks: Joi.number().min(0).required(),
        obtainedMarks: Joi.number().min(0).required()
      })
    )
    .min(1)
    .required()
});
const studentIdParamSchema = Joi.object({
  studentId: Joi.string().hex().length(24).required()
});



module.exports = {
  createSheetSchema,
  addDailyEntrySchema,
  updateWeeklyResultSchema,
  objectIdParamSchema,
  studentIdParamSchema
};