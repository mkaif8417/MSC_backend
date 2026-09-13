const mosqueService = require('../services/mosque.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createMosque = asyncHandler(async (req, res) => {
  const mosque = await mosqueService.createMosque(req.body, req.user);
  return ApiResponse.success(res, 201, 'Mosque created successfully', mosque);
});

const getMosques = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    areaLocalityId,
    villageCityId,
    talukaId,
    districtId,
    isActive,
    search
  } = req.query;

  const filter = {};

  if (areaLocalityId) filter.areaLocalityId = areaLocalityId;
  if (villageCityId) filter.villageCityId = villageCityId;
  if (talukaId) filter.talukaId = talukaId;
  if (districtId) filter.districtId = districtId;
  if (search) filter.search = search;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const result = await mosqueService.getMosques(filter, { page, limit }, req.user);
  return ApiResponse.success(res, 200, 'Mosques fetched successfully', result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages: result.pages
  });
});

const getMosqueById = asyncHandler(async (req, res) => {
  const mosque = await mosqueService.getMosqueById(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Mosque fetched successfully', mosque);
});

const updateMosque = asyncHandler(async (req, res) => {
  const mosque = await mosqueService.updateMosque(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 200, 'Mosque updated successfully', mosque);
});

const deactivateMosque = asyncHandler(async (req, res) => {
  const mosque = await mosqueService.deactivateMosque(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Mosque deactivated successfully', mosque);
});

module.exports = {
  createMosque,
  getMosques,
  getMosqueById,
  updateMosque,
  deactivateMosque
};
