const stateService = require('../../services/location/state.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createState = asyncHandler(async (req, res) => {
  const state = await stateService.createState(req.body);
  return ApiResponse.success(res, 201, 'State created successfully', state);
});

const getStates = asyncHandler(async (req, res) => {
  const { page, limit, name, code, isActive } = req.query;
  const filter = {};

  if (name) filter.name = new RegExp(name, 'i');
  if (code) filter.code = code.toUpperCase();
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const result = await stateService.getStates(filter, { page, limit });
  return ApiResponse.success(res, 200, 'States fetched successfully', result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages: result.pages
  });
});

const getStateById = asyncHandler(async (req, res) => {
  const state = await stateService.getStateById(req.params.id);
  return ApiResponse.success(res, 200, 'State fetched successfully', state);
});

const updateState = asyncHandler(async (req, res) => {
  const state = await stateService.updateState(req.params.id, req.body);
  return ApiResponse.success(res, 200, 'State updated successfully', state);
});

const deactivateState = asyncHandler(async (req, res) => {
  const state = await stateService.deactivateState(req.params.id);
  return ApiResponse.success(res, 200, 'State deactivated successfully', state);
});

module.exports = {
  createState,
  getStates,
  getStateById,
  updateState,
  deactivateState
};
