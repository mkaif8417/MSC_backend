const villageCityService = require('../../services/location/villageCity.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createVillageCity = asyncHandler(async (req, res) => {
  const villageCity = await villageCityService.createVillageCity(req.body, req.user);
  return ApiResponse.success(res, 201, 'Village/City created successfully', villageCity);
});

const getVillagesCities = asyncHandler(async (req, res) => {
  const { page, limit, talukaId, villageCityName, code, type, isActive } = req.query;
  const filter = {};

  if (talukaId) filter.talukaId = talukaId;
  if (villageCityName) filter.villageCityName = new RegExp(villageCityName, 'i');
  if (code) filter.code = code.toUpperCase();
  if (type) filter.type = type.toUpperCase();
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const result = await villageCityService.getVillagesCities(filter, { page, limit }, req.user);
  return ApiResponse.success(res, 200, 'Villages/Cities fetched successfully', result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages: result.pages
  });
});

const getVillageCityById = asyncHandler(async (req, res) => {
  const villageCity = await villageCityService.getVillageCityById(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Village/City fetched successfully', villageCity);
});

const updateVillageCity = asyncHandler(async (req, res) => {
  const villageCity = await villageCityService.updateVillageCity(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 200, 'Village/City updated successfully', villageCity);
});

const deactivateVillageCity = asyncHandler(async (req, res) => {
  const villageCity = await villageCityService.deactivateVillageCity(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Village/City deactivated successfully', villageCity);
});

module.exports = {
  createVillageCity,
  getVillagesCities,
  getVillageCityById,
  updateVillageCity,
  deactivateVillageCity
};