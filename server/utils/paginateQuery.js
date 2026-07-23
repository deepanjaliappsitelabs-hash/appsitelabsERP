// server/utils/paginateQuery.js

const paginateQuery = ({ page = 1, limit = 10 } = {}) => {
  const parsedPage = Number(page) > 0 ? Number(page) : 1;
  const parsedLimit = Number(limit) > 0 ? Number(limit) : 10;

  const skip = (parsedPage - 1) * parsedLimit;
  return { page: parsedPage, limit: parsedLimit, skip };
};

module.exports = paginateQuery;

