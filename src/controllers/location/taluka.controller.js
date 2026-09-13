const talukaService = require('../../services/location/taluka.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createTaluka = asyncHandler(async (req, res) => {
  const taluka = await talukaService.createTaluka(req.body, req.user);
  return ApiResponse.success(res, 201, 'Taluka created successfully', taluka);
});

const getTalukas = asyncHandler(async (req, res) => {
  const { page, limit, districtId, name, code, isActive } = req.query;
  const filter = {};

  if (districtId) filter.districtId = districtId;
  if (name) filter.name = new RegExp(name, 'i');
  if (code) filter.code = code.toUpperCase();
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const result = await talukaService.getTalukas(filter, { page, limit }, req.user);
  return ApiResponse.success(res, 200, 'Talukas fetched successfully', result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages: result.pages
  });
});

const getTalukaById = asyncHandler(async (req, res) => {
  const taluka = await talukaService.getTalukaById(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Taluka fetched successfully', taluka);
});

const updateTaluka = asyncHandler(async (req, res) => {
  const taluka = await talukaService.updateTaluka(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 200, 'Taluka updated successfully', taluka);
});

const deactivateTaluka = asyncHandler(async (req, res) => {
  const taluka = await talukaService.deactivateTaluka(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Taluka deactivated successfully', taluka);
});

module.exports = {
  createTaluka,
  getTalukas,
  getTalukaById,
  updateTaluka,
  deactivateTaluka
};
