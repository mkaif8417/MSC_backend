const studyCenterService = require('../services/studyCenter.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createStudyCenter = asyncHandler(async (req, res) => {
  const studyCenter = await studyCenterService.createStudyCenter(req.body, req.user);
  return ApiResponse.success(res, 201, 'Study Center created successfully', studyCenter);
});

const getStudyCenters = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    mosqueId,
    districtId,
    isActive,
    search
  } = req.query;

  const filter = {};

  if (mosqueId) filter.mosqueId = mosqueId;
  if (districtId) filter.districtId = districtId;
  if (search) filter.search = search;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const result = await studyCenterService.getStudyCenters(filter, { page, limit }, req.user);
  return ApiResponse.success(res, 200, 'Study Centers fetched successfully', result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages: result.pages
  });
});

const getStudyCenterById = asyncHandler(async (req, res) => {
  const studyCenter = await studyCenterService.getStudyCenterById(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Study Center fetched successfully', studyCenter);
});

const updateStudyCenter = asyncHandler(async (req, res) => {
  const studyCenter = await studyCenterService.updateStudyCenter(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 200, 'Study Center updated successfully', studyCenter);
});

const deactivateStudyCenter = asyncHandler(async (req, res) => {
  const studyCenter = await studyCenterService.deactivateStudyCenter(req.params.id, req.user);
  return ApiResponse.success(res, 200, 'Study Center deactivated successfully', studyCenter);
});

module.exports = {
  createStudyCenter,
  getStudyCenters,
  getStudyCenterById,
  updateStudyCenter,
  deactivateStudyCenter
};
