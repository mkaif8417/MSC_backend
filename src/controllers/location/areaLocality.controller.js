const areaLocalityService = require('../../services/location/areaLocality.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createAreaLocality = asyncHandler(async (req, res) => {
  const areaLocality = await areaLocalityService.createAreaLocality(req.body, req.user);
  return ApiResponse.success(res, 201, 'Area/Locality created successfully', areaLocality);
});

const getAreasLocalities = asyncHandler(async (req, res) => {
  const { page, limit, villageCityId, name, code, pincode, isActive } = req.query;
  const filter = {};

  if (villageCityId) filter.villageCityId = villageCityId;
  if (name) filter.name = new RegExp(name, 'i');
  if (code) filter.code = code.toUpperCase();
  if (pincode) filter.pincode = pincode;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const result = await areaLocalityService.getAreasLocalities(filter, { page, limit }, req.user);
  return ApiResponse.success(res, 200, 'Areas/Localities fetched successfully', result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages: result.pages
  });
});

const getAreaLocalityById = asyncHandler(async (req, res) => {
  const areaLocality = await areaLocalityService.getAreaLocalityById(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Area/Locality fetched successfully', areaLocality);
});

const updateAreaLocality = asyncHandler(async (req, res) => {
  const areaLocality = await areaLocalityService.updateAreaLocality(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 200, 'Area/Locality updated successfully', areaLocality);
});

const deactivateAreaLocality = asyncHandler(async (req, res) => {
  const areaLocality = await areaLocalityService.deactivateAreaLocality(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Area/Locality deactivated successfully', areaLocality);
});

module.exports = {
  createAreaLocality,
  getAreasLocalities,
  getAreaLocalityById,
  updateAreaLocality,
  deactivateAreaLocality
};
