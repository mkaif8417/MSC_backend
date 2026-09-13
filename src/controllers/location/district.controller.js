const districtService = require('../../services/location/district.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createDistrict = asyncHandler(async (req, res) => {
  const district = await districtService.createDistrict(req.body, req.user);
  return ApiResponse.success(res, 201, 'District created successfully', district);
});

const getDistricts = asyncHandler(async (req, res) => {
  const { page, limit, stateId, name, code, isActive } = req.query;
  const filter = {};

  if (stateId) filter.stateId = stateId;
  if (name) filter.name = new RegExp(name, 'i');
  if (code) filter.code = code.toUpperCase();
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const result = await districtService.getDistricts(filter, { page, limit }, req.user);
  return ApiResponse.success(res, 200, 'Districts fetched successfully', result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages: result.pages
  });
});

const getDistrictById = asyncHandler(async (req, res) => {
  const district = await districtService.getDistrictById(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'District fetched successfully', district);
});

const updateDistrict = asyncHandler(async (req, res) => {
  const district = await districtService.updateDistrict(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 200, 'District updated successfully', district);
});

const deactivateDistrict = asyncHandler(async (req, res) => {
  const district = await districtService.deactivateDistrict(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'District deactivated successfully', district);
});

module.exports = {
  createDistrict,
  getDistricts,
  getDistrictById,
  updateDistrict,
  deactivateDistrict
};
