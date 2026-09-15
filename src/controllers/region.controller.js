const regionService = require('../services/region.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createRegion = asyncHandler(async (req, res) => {
  const region = await regionService.createRegion(req.body);
  return ApiResponse.success(res, 201, 'Region created successfully', region);
});

const getRegions = asyncHandler(async (req, res) => {
  const { page, limit, divisionId, isActive, search } = req.query;

  const filter = {};
  if (divisionId) filter.divisionId = divisionId;
  if (search) filter.search = search;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const result = await regionService.getRegions(filter, { page, limit });
  return ApiResponse.success(res, 200, 'Regions fetched successfully', result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages: result.pages
  });
});

const getRegionById = asyncHandler(async (req, res) => {
  const region = await regionService.getRegionById(req.params.id);
  return ApiResponse.success(res, 200, 'Region fetched successfully', region);
});

const updateRegion = asyncHandler(async (req, res) => {
  const region = await regionService.updateRegion(req.params.id, req.body);
  return ApiResponse.success(res, 200, 'Region updated successfully', region);
});

const deactivateRegion = asyncHandler(async (req, res) => {
  const region = await regionService.deactivateRegion(req.params.id);
  return ApiResponse.success(res, 200, 'Region deactivated successfully', region);
});

module.exports = {
  createRegion,
  getRegions,
  getRegionById,
  updateRegion,
  deactivateRegion
};