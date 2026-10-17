class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const badRequest = (message) => new ApiError(400, message);
const forbidden = (message = 'No tienes permisos para realizar esta acción.') => new ApiError(403, message);
const notFound = (message) => new ApiError(404, message);
const conflict = (message) => new ApiError(409, message);
const unauthorized = (message = 'No autorizado.') => new ApiError(401, message);

module.exports = { ApiError, badRequest, forbidden, notFound, conflict, unauthorized };
