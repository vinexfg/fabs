// Envolve handlers síncronos/assíncronos com try/catch automático
const wrap = (fn) => (req, res, next) => {
  try {
    const result = fn(req, res, next);
    if (result && typeof result.catch === 'function') result.catch(next);
  } catch (err) {
    next(err);
  }
};

module.exports = { wrap };
