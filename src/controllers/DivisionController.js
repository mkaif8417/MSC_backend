const Division = require('../models/Division');
const District = require('../models/District');

// ==========================================
// Create Division
// ==========================================
exports.createDivision = async (req, res) => {
  try {
    const { name, code, stateId, hqDistrictId, isActive } = req.body;

    const duplicate = await Division.exists({ stateId, name });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Division "${name}" already exists for this state`
      });
    }

    const division = await Division.create({
      name,
      code,
      stateId,
      hqDistrictId: hqDistrictId || null,
      isActive
    });

    return res.status(201).json({
      success: true,
      data: division,
      message: 'Division created successfully.'
    });
  } catch (err) {
    console.error('createDivision error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create division' });
  }
};

// ==========================================
// List Divisions (paginated + filterable)
// ==========================================
exports.getDivisions = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, stateId, isActive } = req.query;

    const filter = {};
    if (stateId) filter.stateId = stateId;
    if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;
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

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total
      }
    });
  } catch (err) {
    console.error('getDivisions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch divisions' });
  }
};

// ==========================================
// Get Division by ID
// ==========================================
exports.getDivisionById = async (req, res) => {
  try {
    const division = await Division.findById(req.params.id)
      .populate('stateId', 'name')
      .populate('hqDistrictId', 'name code');

    if (!division) {
      return res.status(404).json({ success: false, message: 'Division not found' });
    }

    return res.status(200).json({ success: true, data: division });
  } catch (err) {
    console.error('getDivisionById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch division' });
  }
};

// ==========================================
// Update Division (PATCH)
// ==========================================
exports.updateDivision = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, stateId } = req.body;

    if (name && stateId) {
      const duplicate = await Division.exists({ stateId, name, _id: { $ne: id } });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Division "${name}" already exists for this state`
        });
      }
    }

    const division = await Division.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!division) {
      return res.status(404).json({ success: false, message: 'Division not found' });
    }

    return res.status(200).json({
      success: true,
      data: division,
      message: 'Division updated successfully.'
    });
  } catch (err) {
    console.error('updateDivision error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update division' });
  }
};

// ==========================================
// Deactivate Division (soft delete, matches deactivateDistrict pattern)
// ==========================================
exports.deactivateDivision = async (req, res) => {
  try {
    const division = await Division.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!division) {
      return res.status(404).json({ success: false, message: 'Division not found' });
    }

    return res.status(200).json({
      success: true,
      data: division,
      message: 'Division deactivated successfully.'
    });
  } catch (err) {
    console.error('deactivateDivision error:', err);
    return res.status(500).json({ success: false, message: 'Failed to deactivate division' });
  }
};

// ==========================================
// Districts belonging to a given division (used by cascading dropdowns)
// ==========================================
exports.getDistrictsByDivision = async (req, res) => {
  try {
    const districts = await District.find({ divisionId: req.params.id, isActive: true })
      .select('name code')
      .sort({ name: 1 });

    return res.status(200).json({ success: true, data: districts });
  } catch (err) {
    console.error('getDistrictsByDivision error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch districts for division' });
  }
};

// ==========================================
// Districts for a given state (used by the "HQ District" dropdown in the modal)
// ==========================================
exports.getDistrictsByState = async (req, res) => {
  try {
    const districts = await District.find({ stateId: req.params.stateId, isActive: true })
      .select('name code')
      .sort({ name: 1 });

    return res.status(200).json({ success: true, data: districts });
  } catch (err) {
    console.error('getDistrictsByState error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch districts for state' });
  }
};