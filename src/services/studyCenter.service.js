const studyCenterDao = require('../daos/studyCenter.dao');
const mosqueDao = require('../daos/mosque.dao');
const areaLocalityDao = require('../daos/areaLocality.dao');
const villageCityDao = require('../daos/villageCity.dao');
const talukaDao = require('../daos/taluka.dao');
const ERROR_CODES = require('../constants/errorCodes');
const { ROLES } = require('../constants/roles');

/**
 * Traverse up to parent District ID to validate scope for District Admin
 */
const validateDistrictScopeByMosqueId = async (userContext, mosqueId) => {
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    const mosque = await mosqueDao.findById(mosqueId, null, {
      path: 'areaLocalityId',
      populate: {
        path: 'villageCityId',
        populate: { path: 'talukaId' }
      }
    });

    if (
      !mosque ||
      !mosque.areaLocalityId ||
      !mosque.areaLocalityId.villageCityId ||
      !mosque.areaLocalityId.villageCityId.talukaId ||
      !allowedDistrictId
    ) {
      const error = new Error(
        'Access denied: You are not authorized to manage resources outside your assigned district'
      );
      error.statusCode = 403;
      error.code = ERROR_CODES.FORBIDDEN;
      throw error;
    }

    const districtId = mosque.areaLocalityId.villageCityId.talukaId.districtId;
    if (districtId.toString() !== allowedDistrictId.toString()) {
      const error = new Error(
        'Access denied: You are not authorized to manage resources outside your assigned district'
      );
      error.statusCode = 403;
      error.code = ERROR_CODES.FORBIDDEN;
      throw error;
    }
  }
};

/**
 * Resolve all Mosque ObjectIds belonging to a given District
 */
const resolveMosqueIdsForDistrict = async (districtId) => {
  if (!districtId) return [];

  const talukas = await talukaDao.findByDistrict(districtId);
  const talukaIds = talukas.map((t) => t._id);

  const villages = await villageCityDao.findMany({ talukaId: { $in: talukaIds } });
  const villageCityIds = villages.map((v) => v._id);

  const areas = await areaLocalityDao.findMany({ villageCityId: { $in: villageCityIds } });
  const areaLocalityIds = areas.map((a) => a._id);

  const mosques = await mosqueDao.findMany({ areaLocalityId: { $in: areaLocalityIds } });
  return mosques.map((m) => m._id);
};

/**
 * Create new Study Center
 */
const createStudyCenter = async (data, userContext) => {
  const {
    name,
    mosqueId,
    startDate,
    tablesCount,
    chairsCount,
    capacity,
    roomsCount,
    inchargeName,
    contactNumber,
    facilities,
    grade,
    isActive
  } = data;

  // 1. Validate parent Mosque exists
  const parentMosque = await mosqueDao.findById(mosqueId);
  if (!parentMosque) {
    const error = new Error(`Parent Mosque with ID ${mosqueId} does not exist`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  // 2. Validate parent Mosque is active
  if (!parentMosque.isActive) {
    const error = new Error(
      `Cannot create study center under inactive Mosque "${parentMosque.name}"`
    );
    error.statusCode = 400;
    error.code = ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  // 3. Validate scope hierarchy up to District
  await validateDistrictScopeByMosqueId(userContext, mosqueId);

  // 4. Service-level check: Verify 1-to-1 constraint (No existing Study Center for this Mosque)
  const existingCenter = await studyCenterDao.findByMosqueId(mosqueId);
  if (existingCenter) {
    const error = new Error(
      `Mosque "${parentMosque.name}" already has an associated Study Center`
    );
    error.statusCode = 409;
    error.code = ERROR_CODES.DUPLICATE_RESOURCE;
    throw error;
  }

  try {
    return await studyCenterDao.create({
      name: name ? name.trim() : undefined,
      mosqueId,
      startDate,
      tablesCount: tablesCount !== undefined ? Number(tablesCount) : 0,
      chairsCount: chairsCount !== undefined ? Number(chairsCount) : 0,
      capacity: capacity !== undefined ? Number(capacity) : 0,
      roomsCount: roomsCount !== undefined ? Number(roomsCount) : 0,
      inchargeName: inchargeName ? inchargeName.trim() : undefined,
      contactNumber: contactNumber ? contactNumber.trim() : undefined,
      facilities,
      grade,
      isActive: isActive !== undefined ? isActive : true
    });
  } catch (err) {
    // Handle MongoDB E11000 duplicate key error on mosqueId unique index
    if (err.code === 11000 && err.keyPattern && err.keyPattern.mosqueId) {
      const error = new Error(
        `Mosque "${parentMosque.name}" already has an associated Study Center`
      );
      error.statusCode = 409;
      error.code = ERROR_CODES.DUPLICATE_RESOURCE;
      throw error;
    }
    throw err;
  }
};

/**
 * Get Study Centers with filtering & scope restriction
 */
const getStudyCenters = async (filter = {}, pagination = {}, userContext = null) => {
  const queryFilter = {};

  if (filter.isActive !== undefined) {
    queryFilter.isActive = filter.isActive;
  }

  if (filter.search) {
    const searchRegex = new RegExp(filter.search, 'i');
    queryFilter.$or = [{ name: searchRegex }, { inchargeName: searchRegex }];
  }

  let allowedMosqueIds = null;

  if (filter.mosqueId) {
    allowedMosqueIds = [filter.mosqueId];
  } else if (filter.districtId) {
    allowedMosqueIds = await resolveMosqueIdsForDistrict(filter.districtId);
  }

  // Enforce District Admin scope
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    if (!allowedDistrictId) {
      queryFilter.mosqueId = null;
    } else {
      const districtMosqueIds = await resolveMosqueIdsForDistrict(allowedDistrictId);
      const districtMosqueIdStrings = districtMosqueIds.map((id) => id.toString());

      if (allowedMosqueIds !== null) {
        const validIntersect = allowedMosqueIds.filter((id) =>
          districtMosqueIdStrings.includes(id.toString())
        );

        if (validIntersect.length === 0) {
          queryFilter.mosqueId = null;
        } else if (validIntersect.length === 1) {
          queryFilter.mosqueId = validIntersect[0];
        } else {
          queryFilter.mosqueId = { $in: validIntersect };
        }
      } else {
        queryFilter.mosqueId = { $in: districtMosqueIds };
      }
    }
  } else if (allowedMosqueIds !== null) {
    if (allowedMosqueIds.length === 0) {
      queryFilter.mosqueId = null;
    } else if (allowedMosqueIds.length === 1) {
      queryFilter.mosqueId = allowedMosqueIds[0];
    } else {
      queryFilter.mosqueId = { $in: allowedMosqueIds };
    }
  }

  return studyCenterDao.paginate(queryFilter, pagination);
};

/**
 * Get Study Center by ID
 */
const getStudyCenterById = async (id, userContext = null) => {
  const studyCenter = await studyCenterDao.findById(id, null, {
    path: 'mosqueId',
    select: 'name address areaLocalityId isActive'
  });

  if (!studyCenter) {
    const error = new Error(`Study Center not found with ID ${id}`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  const parentMosqueId = studyCenter.mosqueId._id || studyCenter.mosqueId;
  await validateDistrictScopeByMosqueId(userContext, parentMosqueId);

  return studyCenter;
};

/**
 * Update Study Center
 */
const updateStudyCenter = async (id, updateData, userContext = null) => {
  const existingCenter = await getStudyCenterById(id, userContext);
  const parentMosqueId = existingCenter.mosqueId._id || existingCenter.mosqueId;

  // Validate scope for parent Mosque
  await validateDistrictScopeByMosqueId(userContext, parentMosqueId);

  // IMMUTABILITY CHECK: Reject attempts to mutate mosqueId
  if (
    updateData.mosqueId &&
    updateData.mosqueId.toString() !== parentMosqueId.toString()
  ) {
    const error = new Error(
      'mosqueId is immutable and cannot be changed after Study Center creation'
    );
    error.statusCode = 400;
    error.code = ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  const formattedData = { ...updateData };
  delete formattedData.mosqueId; // Ensure mosqueId is not altered

  if (formattedData.name) formattedData.name = formattedData.name.trim();
  if (formattedData.inchargeName) formattedData.inchargeName = formattedData.inchargeName.trim();
  if (formattedData.contactNumber) formattedData.contactNumber = formattedData.contactNumber.trim();

  return studyCenterDao.updateById(id, formattedData);
};

/**
 * Deactivate Study Center (Soft deactivation)
 */
const deactivateStudyCenter = async (id, userContext = null) => {
  await getStudyCenterById(id, userContext);
  return studyCenterDao.updateById(id, { isActive: false });
};

module.exports = {
  validateDistrictScopeByMosqueId,
  resolveMosqueIdsForDistrict,
  createStudyCenter,
  getStudyCenters,
  getStudyCenterById,
  updateStudyCenter,
  deactivateStudyCenter
};
