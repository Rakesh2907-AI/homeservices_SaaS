module.exports = {
  db: require('./db/client'),
  cache: require('./cache/tenantCache'),
  logger: require('./utils/logger'),
  errors: require('./utils/errors'),
  jwt: require('./utils/jwt'),
  middleware: {
    tenantContext: require('./middleware/tenantContext'),
    auth: require('./middleware/auth'),
    errorHandler: require('./middleware/errorHandler'),
  },
};
