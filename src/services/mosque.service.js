const mosqueDao = require('../daos/mosque.dao');
const areaLocalityDao = require('../daos/areaLocality.dao');
const villageCityDao = require('../daos/villageCity.dao');
const talukaDao = require('../daos/taluka.dao');
const ERROR_CODES = require('../constants/errorCodes');
const { ROLES } = require('../constants/roles');

/**
 * Traverse up to parent District ID to validate scope for District Admin
 */
const validateDistrictScopeByAreaLocalityId = async (userContext, areaLocalityId) => {
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    const areaLocality = await areaLocalityDao.findById(areaLocalityId, null, {
      path: 'villageCityId',
      populate: { path: 'talukaId' }
    });

    if (
      !areaLocality ||
      !areaLocality.villageCityId ||
      !areaLocality.villageCityId.talukaId ||
      !allowedDistrictId
    ) {
      const error = new Error(
        'Access denied: You are not authorized to manage resources outside your assigned district'
      );
      error.statusCode = 403;
      error.code = ERROR_CODES.FORBIDDEN;
      throw error;
    }

    const districtId = areaLocality.villageCityId.talukaId.districtId;
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
 * Resolve AreaLocality ObjectIds belonging to a given District, Taluka, or VillageCity
 */
const resolveAreaLocalityIdsForHierarchy = async ({ districtId, talukaId, villageCityId }) => {
  let villageCityIds = [];

  if (villageCityId) {
    villageCityIds = [villageCityId];
  } else if (talukaId) {
    const villages = await villageCityDao.findMany({ talukaId });
    villageCityIds = villages.map((v) => v._id);
  } else if (districtId) {
    const talukas = await talukaDao.findByDistrict(districtId);
    const talukaIds = talukas.map((t) => t._id);
    const villages = await villageCityDao.findMany({ talukaId: { $in: talukaIds } });
    villageCityIds = villages.map((v) => v._id);
  } else {
    return null;
  }

  const areas = await areaLocalityDao.findMany({ villageCityId: { $in: villageCityIds } });
  return areas.map((a) => a._id);
};

/**
 * Generate the next mosque code for a given Area/Locality code, e.g.
 * areaLocalityCode "SH" -> "SH-01", "SH-02", ...
 */
const generateMosqueCode = async (areaLocalityCode) => {
  const prefix = areaLocalityCode.trim().toUpperCase();
  const existingMosques = await mosqueDao.findByCodePrefix(prefix);

  let maxSequence = 0;

  existingMosques.forEach((mosque) => {
    const match = mosque.code && mosque.code.match(new RegExp(`^${prefix}-(\\d+)$`, 'i'));
    if (match) {
      const sequence = parseInt(match[1], 10);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  });

  const nextSequence = maxSequence + 1;
  const paddedSequence = String(nextSequence).padStart(2, '0');

  return `${prefix}-${paddedSequence}`;
};

/**
 * Create new Mosque
 */
const createMosque = async (data, userContext) => {
  const {
    name,
    address,
    pincode,
    areaLocalityId,
    latitude,
    longitude,
    googleMapsUrl,
    capacity,
    inchargeName,
    contactNumber,
    isActive
  } = data;

  // 1. Validate parent AreaLocality exists
  const parentArea = await areaLocalityDao.findById(areaLocalityId);
  if (!parentArea) {
    const error = new Error(`Parent Area/Locality with ID ${areaLocalityId} does not exist`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  // 2. Validate scope hierarchy up to District
  await validateDistrictScopeByAreaLocalityId(userContext, areaLocalityId);

  // 3. Validate parent AreaLocality is active
  if (!parentArea.isActive) {
    const error = new Error(
      `Cannot create mosque under inactive Area/Locality "${parentArea.name}"`
    );
    error.statusCode = 400;
    error.code = ERROR_CODES.VALIDATION_ERROR;
    throw error;
  }

  // 4. Check duplicate name under same AreaLocality
  const existingMosque = await mosqueDao.findByNameAndAreaLocality(name, areaLocalityId);
  if (existingMosque) {
    const error = new Error(
      `Mosque "${name}" already exists under Area/Locality "${parentArea.name}"`
    );
    error.statusCode = 409;
    error.code = ERROR_CODES.DUPLICATE_RESOURCE;
    throw error;
  }

  // 5. Generate a unique mosque code from the parent Area/Locality's code
  const code = await generateMosqueCode(parentArea.code);

  // 6. Construct locationPin GeoJSON if lat/lng are provided
  let locationPin;
  if (latitude !== undefined && longitude !== undefined) {
    locationPin = {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)]
    };
  }

  return mosqueDao.create({
    code,
    name: name.trim(),
    address: address.trim(),
    pincode: pincode.trim(),
    areaLocalityId,
    latitude: latitude !== undefined ? Number(latitude) : undefined,
    longitude: longitude !== undefined ? Number(longitude) : undefined,
    locationPin,
    googleMapsUrl: googleMapsUrl ? googleMapsUrl.trim() : undefined,
    capacity: capacity !== undefined ? Number(capacity) : undefined,
    inchargeName: inchargeName ? inchargeName.trim() : undefined,
    contactNumber: contactNumber ? contactNumber.trim() : undefined,
    isActive: isActive !== undefined ? isActive : true
  });
};

/**
 * Get Mosques with cascading filters & scope restriction
 */
const getMosques = async (filter = {}, pagination = {}, userContext = null) => {
  const queryFilter = {};

  if (filter.isActive !== undefined) {
    queryFilter.isActive = filter.isActive;
  }

  if (filter.search) {
    const searchRegex = new RegExp(filter.search, 'i');
    queryFilter.$or = [{ name: searchRegex }, { address: searchRegex }, { code: searchRegex }];
  }

  // Handle cascading location hierarchy filters (districtId, talukaId, villageCityId, areaLocalityId)
  let allowedAreaIds = null;

  if (filter.areaLocalityId) {
    allowedAreaIds = [filter.areaLocalityId];
  } else if (filter.villageCityId || filter.talukaId || filter.districtId) {
    allowedAreaIds = await resolveAreaLocalityIdsForHierarchy({
      districtId: filter.districtId,
      talukaId: filter.talukaId,
      villageCityId: filter.villageCityId
    });
  }

  // Enforce District Admin scope
  if (userContext && userContext.role === ROLES.DISTRICT_ADMIN) {
    const allowedDistrictId = userContext.scope && userContext.scope.districtId;
    if (!allowedDistrictId) {
      queryFilter.areaLocalityId = null; // Unauthorized user scope -> empty
    } else {
      const districtAreaIds = await resolveAreaLocalityIdsForHierarchy({
        districtId: allowedDistrictId
      });

      const districtAreaIdStrings = (districtAreaIds || []).map((id) => id.toString());

      if (allowedAreaIds !== null) {
        // Intersect requested areas with user's allowed district areas
        const validIntersect = allowedAreaIds.filter((id) =>
          districtAreaIdStrings.includes(id.toString())
        );

        if (validIntersect.length === 0) {
          queryFilter.areaLocalityId = null; // No match within allowed district
        } else if (validIntersect.length === 1) {
          queryFilter.areaLocalityId = validIntersect[0];
        } else {
          queryFilter.areaLocalityId = { $in: validIntersect };
        }
      } else {
        queryFilter.areaLocalityId = { $in: districtAreaIds };
      }
    }
  } else if (allowedAreaIds !== null) {
    if (allowedAreaIds.length === 0) {
      queryFilter.areaLocalityId = null;
    } else if (allowedAreaIds.length === 1) {
      queryFilter.areaLocalityId = allowedAreaIds[0];
    } else {
      queryFilter.areaLocalityId = { $in: allowedAreaIds };
    }
  }

  return mosqueDao.paginate(queryFilter, pagination);
};

/**
 * Get Mosque by ID
 */
const getMosqueById = async (id, userContext = null) => {
  const mosque = await mosqueDao.findById(id, null, {
    path: 'areaLocalityId',
    select: 'name code villageCityId pincode isActive'
  });

  if (!mosque) {
    const error = new Error(`Mosque not found with ID ${id}`);
    error.statusCode = 404;
    error.code = ERROR_CODES.NOT_FOUND;
    throw error;
  }

  const parentAreaLocalityId = mosque.areaLocalityId._id || mosque.areaLocalityId;
  await validateDistrictScopeByAreaLocalityId(userContext, parentAreaLocalityId);

  return mosque;
};

/**
 * Update Mosque
 */
const updateMosque = async (id, updateData, userContext = null) => {
  const existingMosque = await getMosqueById(id, userContext);
  const targetAreaLocalityId =
    updateData.areaLocalityId ||
    existingMosque.areaLocalityId._id ||
    existingMosque.areaLocalityId;

  // Validate scope for the target parent AreaLocality
  await validateDistrictScopeByAreaLocalityId(userContext, targetAreaLocalityId);

  // If areaLocalityId is changed, ensure target AreaLocality exists and is active
  if (updateData.areaLocalityId) {
    const parentArea = await areaLocalityDao.findById(updateData.areaLocalityId);
    if (!parentArea || !parentArea.isActive) {
      const error = new Error(
        `Parent Area/Locality with ID ${updateData.areaLocalityId} is invalid or inactive`
      );
      error.statusCode = 400;
      error.code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }
  }

  // Check duplicate name under target AreaLocality
  if (updateData.name || updateData.areaLocalityId) {
    const checkName = updateData.name || existingMosque.name;
    const conflict = await mosqueDao.findByNameAndAreaLocality(checkName, targetAreaLocalityId);
    if (conflict && conflict._id.toString() !== id.toString()) {
      const error = new Error(
        `Mosque name "${checkName}" is already in use under this Area/Locality`
      );
      error.statusCode = 409;
      error.code = ERROR_CODES.DUPLICATE_RESOURCE;
      throw error;
    }
  }

  const formattedData = { ...updateData };

  if (formattedData.name) formattedData.name = formattedData.name.trim();
  if (formattedData.address) formattedData.address = formattedData.address.trim();
  if (formattedData.pincode) formattedData.pincode = formattedData.pincode.trim();
  if (formattedData.googleMapsUrl) formattedData.googleMapsUrl = formattedData.googleMapsUrl.trim();
  if (formattedData.inchargeName) formattedData.inchargeName = formattedData.inchargeName.trim();
  if (formattedData.contactNumber) formattedData.contactNumber = formattedData.contactNumber.trim();

  // Update locationPin if latitude or longitude changed
  const newLat = formattedData.latitude !== undefined ? formattedData.latitude : existingMosque.latitude;
  const newLng = formattedData.longitude !== undefined ? formattedData.longitude : existingMosque.longitude;

  if (newLat !== undefined && newLng !== undefined) {
    formattedData.locationPin = {
      type: 'Point',
      coordinates: [Number(newLng), Number(newLat)]
    };
  }

  return mosqueDao.updateById(id, formattedData);
};

/**
 * Deactivate Mosque (Soft deactivation)
 */
const deactivateMosque = async (id, userContext = null) => {
  await getMosqueById(id, userContext);
  return mosqueDao.updateById(id, { isActive: false });
};

module.exports = {
  validateDistrictScopeByAreaLocalityId,
  resolveAreaLocalityIdsForHierarchy,
  generateMosqueCode,
  createMosque,
  getMosques,
  getMosqueById,
  updateMosque,
  deactivateMosque
};