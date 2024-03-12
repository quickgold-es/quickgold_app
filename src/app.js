const express = require("express");
const morgan = require("morgan");
const config = require("./config");
const cors = require("cors");

const clientes = require("./modulos/clientes/rutas");
const usuarios = require("./modulos/usuarios/rutas");
const auth = require("./modulos/auth/rutas");
const error = require("./red/errors");

const app = express();
app.use(cors());

//middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//configuracion
app.set("port", config.app.port);

//rutas
//aqui tambin colocar la seguridad del token
app.use("/api/clientes", clientes);
app.use("/api/usuarios", usuarios);
app.use("/api/auth", auth);
app.use(error);

module.exports = app;
