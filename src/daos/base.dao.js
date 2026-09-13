/**
 * Generic Base Data Access Object factory providing standard persistence operations.
 * Must NOT contain domain rules, business authorization, or HTTP logic.
 */
const createBaseDao = (model) => {
  if (!model) {
    throw new Error('BaseDao requires a valid Mongoose model');
  }

  /**
   * Create new document
   * @param {Object} data Document data
   * @returns {Promise<Object>} Created document
   */
  const create = async (data) => {
    const document = new model(data);
    return document.save();
  };

  /**
   * Find document by ID
   * @param {String|ObjectId} id Document ID
   * @param {String|Object} select Fields to select/exclude
   * @param {Object} populate Populate options
   * @returns {Promise<Object|null>} Document or null
   */
  const findById = async (id, select = null, populate = null) => {
    let query = model.findById(id);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    return query.exec();
  };

  /**
   * Find single document matching criteria
   * @param {Object} filter Query filter
   * @param {String|Object} select Fields to select/exclude
   * @param {Object} populate Populate options
   * @returns {Promise<Object|null>} Document or null
   */
  const findOne = async (filter = {}, select = null, populate = null) => {
    let query = model.findOne(filter);
    if (select) query = query.select(select);
    if (populate) query = query.populate(populate);
    return query.exec();
  };

  /**
   * Find multiple documents matching criteria
   * @param {Object} filter Query filter
   * @param {Object} options Sorting, limit, skip, select, populate options
   * @returns {Promise<Array>} List of documents
   */
  const findMany = async (filter = {}, options = {}) => {
    const { select = null, sort = { createdAt: -1 }, limit = 0, skip = 0, populate = null } = options;

    let query = model.find(filter);
    if (select) query = query.select(select);
    if (sort) query = query.sort(sort);
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);
    if (populate) query = query.populate(populate);

    return query.exec();
  };

  /**
   * Update document by ID
   * @param {String|ObjectId} id Document ID
   * @param {Object} updateData Update fields
   * @param {Object} options Mongoose update options
   * @returns {Promise<Object|null>} Updated document
   */
  const updateById = async (id, updateData, options = { new: true, runValidators: true }) => {
    return model.findByIdAndUpdate(id, updateData, options).exec();
  };

  /**
   * Delete document by ID
   * @param {String|ObjectId} id Document ID
   * @returns {Promise<Object|null>} Deleted document
   */
  const deleteById = async (id) => {
    return model.findByIdAndDelete(id).exec();
  };

  /**
   * Count documents matching criteria
   * @param {Object} filter Query filter
   * @returns {Promise<Number>} Document count
   */
  const count = async (filter = {}) => {
    return model.countDocuments(filter).exec();
  };

  /**
   * Paginated find
   * @param {Object} filter Query filter
   * @param {Object} pagination { page: 1, limit: 20, sort, select, populate }
   * @returns {Promise<Object>} { items, total, page, limit, pages }
   */
  const paginate = async (filter = {}, pagination = {}) => {
    const page = Math.max(1, parseInt(pagination.page || 1, 10));

    // NOTE: this cap used to be 100, which silently truncated any screen
    // that fetches a "full list" for a dropdown (e.g. all 226 talukas) to
    // just the 100 most recently created records - older seeded data (like
    // early-seeded districts' talukas) would never appear, with no error
    // anywhere in the chain. Raised to 1000 so legitimate bulk-list fetches
    // aren't clipped. Paginated UI tables (page=1, limit=10/20/50) are
    // completely unaffected since they ask for far less than this ceiling.
    const limit = Math.max(1, Math.min(1000, parseInt(pagination.limit || 20, 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      findMany(filter, { ...pagination, skip, limit }),
      count(filter)
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  };

  return {
    model,
    create,
    findById,
    findOne,
    findMany,
    updateById,
    deleteById,
    count,
    paginate
  };
};

module.exports = createBaseDao;