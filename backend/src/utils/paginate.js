export const pageParams = (req, fallbackLimit = 10) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || fallbackLimit));
  return { page, limit, skip: (page - 1) * limit };
};

export const paged = (items, total, page, limit) => ({
  success: true,
  items,
  total,
  page,
  pages: Math.ceil(total / limit) || 1
});
