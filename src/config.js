require("dotenv").config();

module.exports = {
  app: {
    port: process.env.PORT || 5000,
  },
  jwt: {
    secret: process.env.JWT_SECRET || "notasecreta",
  },
  mysql: {
    host: process.env.MYSQL_HOST || "51.91.251.183",
    user: process.env.MYSQL_USER || "quickgold_app",
    password: process.env.MYSQL_PASSWORD || "DVwebQG24*",
    database: process.env.MYSQL_DB || "quickgold_app",
  },
};
