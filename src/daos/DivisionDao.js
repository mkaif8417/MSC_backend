const Division = require('../models/Division');
const District = require('../models/District');

/**
 * DivisionDao
 * Pure data-access layer — no req/res here, just mongoose operations.
 */
class DivisionDao {
  async create(payload) {
    return Division.create(payload);
  }

  // Paginated + filterable, matching the same contract as your District list API
  async findAllPaginated({ page = 1, limit = 10, name, stateId, isActive }) {
    const filter = {};
    if (stateId) filter.stateId = stateId;
    if (isActive !== undefined) filter.isActive = isActive;
    if (name) filter.name = { $regex: name, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      Division.find(filter)
        .populate('stateId', 'name')
        .populate('hqDistrictId', 'name code')
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Division.countDocuments(filter)
    ]);

    return { data, total };
  }

  async findById(id) {
    return Division.findById(id)
      .populate('stateId', 'name')
      .populate('hqDistrictId', 'name code');
  }

  async update(id, payload) {
    return Division.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  }

  async softDelete(id) {
    return Division.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async hardDelete(id) {
    return Division.findByIdAndDelete(id);
  }

  async findDistrictsByDivision(divisionId) {
    return District.find({ divisionId }).sort({ name: 1 });
  }

  // For the modal's "HQ District" dropdown — districts belonging to the selected state
  async findDistrictsByState(stateId) {
    return District.find({ stateId, isActive: true }).select('name code').sort({ name: 1 });
  }

  async existsByName(stateId, name, excludeId = null) {
    const filter = { stateId, name };
    if (excludeId) filter._id = { $ne: excludeId };
    return Division.exists(filter);
  }
}

module.exports = new DivisionDao();