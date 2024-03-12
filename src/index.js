const express = require("express");
const mysql = require("mysql");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const PORT = 4000;
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config({ path: "../.env" });

// Configurar body-parser middleware
const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Configuración de la base de datos MySQL
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
});
// Conectar a la base de datos
connection.connect(function (err) {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
    return;
  }
  console.log("Conexión a la base de datos establecida correctamente");
});
// Configuración de nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_CORREO,
    pass: process.env.GMAIL_PASSWORD,
  },
});
// Rutas
app.get("/verificar-usuario", (req, res) => {
  const { correo } = req.query;
  //console.log(correo);

  // Verificar si el usuario existe en la base de datos
  connection.query(
    "SELECT * FROM ot_customer WHERE email = ?",
    [correo],
    (error, results) => {
      if (error) throw error;

      if (results.length > 0) {
        // Generar un token y enviar un correo electrónico con una URL que incluya el token
        const token = generateToken(correo);
        //console.log("Token generado para", correo, ":", token);
        nombre = results[0].name;
        //console.log(results[0].name);
        const url = `https://quickgold.es/app/registro?token=${token}&nombre=${nombre}`;

        const mailOptions = {
          from: "dev@quickgold.es",
          to: correo,
          subject: "Asignar contraseña",
          text: `Haz clic en el siguiente enlace para restablecer tu contraseña: ${url}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            //console.log(error);
            res.status(500).send("Error al enviar el correo electrónico");
          } else {
            //console.log("Correo electrónico enviado: " + info.response);
            res.send("Correo electrónico enviado con éxito");
          }
        });
      } else {
        const token = generateToken(correo);
        //console.log("Token generado para", correo, ":", token);
        const url = `https://quickgold.es/app/registro?token=${token}`;

        const mailOptions = {
          from: "dev@quickgold.es",
          to: correo,
          subject: "Registrarte",
          text: `Haz clic en el siguiente enlace para registrarte: ${url}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            //console.log(error);
            res.status(500).send("Error al enviar el correo electrónico");
          } else {
            //console.log("Correo electrónico enviado: " + info.response);
            res.send("Correo electrónico enviado con éxito");
          }
        });
        //res.status(401).json({ message: "Usuario no encontrado" });
        //console.log("no encontrado el usuario");
      }
    }
  );
});
// Función para generar un token
function generateToken(correo) {
  // Define la información que deseas incluir en el token
  const payload = {
    correo: correo,
    // Puedes incluir más información aquí si lo deseas
  };
  //console.log(correo);
  // Firma el token con una clave secreta. Asegúrate de mantener esta clave secreta en un lugar seguro.
  const claveSecreta = process.env.TOKEN_SECRET_CORREO; // Cambia esto por tu propia clave secreta
  const opciones = {
    expiresIn: "1h", // Tiempo de expiración del token (opcional)
  };
  // Crea y devuelve el token firmado
  const token = jwt.sign(payload, claveSecreta, opciones);
  return token;
}
// Ruta para restablecer la contraseña
app.post("/resetear-contrasena", (req, res) => {
  const { nuevaContrasena, token, name } = req.body;
  //console.log(req.body);
  // Verificar si el token es válido y decodificarlo
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET_CORREO); // Reemplaza 'clave_secreta_para_jwt' con tu propia clave secreta
    //console.log("decode", decoded.correo);
    // Verificar si el usuario existe en la base de datos
    connection.query(
      "SELECT * FROM ot_customer WHERE email = ?",
      [decoded.correo],
      (error, results) => {
        if (error) {
          console.error("Error al buscar usuario en la base de datos", error);
          res.status(500).json("Error al restablecer la contraseña");
          return;
        }

        if (results.length === 0) {
          // Si el usuario no existe, inserta la nueva contraseña en la base de datos
          bcrypt.hash(nuevaContrasena, 10, (err, hash) => {
            if (err) {
              console.error("Error al encriptar la contraseña", err);
              res.status(500).json("Error al restablecer la contraseña");
            } else {
              // Insertar el nuevo usuario con la contraseña encriptada
              connection.query(
                "INSERT INTO ot_customer (email, password, name, company_id, type_id) VALUES (?, ?, ?, ?, ?)",
                [decoded.correo, hash, name, 8, 5],
                (error, results) => {
                  if (error) {
                    console.error("Error al insertar el usuario", error);
                    res.status(500).json("Error al restablecer la contraseña");
                  } else {
                    res.status(200).json({
                      message: "Contraseña restablecida correctamente",
                    });
                  }
                }
              );
            }
          });
        } else {
          // Si el usuario existe, actualiza la contraseña en la base de datos
          bcrypt.hash(nuevaContrasena, 10, (err, hash) => {
            if (err) {
              console.error("Error al encriptar la contraseña", err);
              res.status(500).json("Error al restablecer la contraseña");
            } else {
              // Actualizar la contraseña en la base de datos
              connection.query(
                "UPDATE ot_customer SET password = ? WHERE email = ?",
                [hash, decoded.correo],
                (error, results) => {
                  if (error) {
                    console.error(
                      "Error al actualizar la contraseña en la base de datos",
                      error
                    );
                    res.status(500).json("Error al restablecer la contraseña");
                  } else {
                    res.json("Contraseña restablecida correctamente");
                  }
                }
              );
            }
          });
        }
      }
    );
  } catch (error) {
    console.error("Error al verificar y decodificar el token:", error);
    res.status(400).json("Token inválido o expirado");
  }
});

//verificacion de rutas para protejerlas
const verifyUser = (req, res, next) => {
  const token = req?.headers?.authorization?.split(" ")[1];
  //console.log("token node", token);
  if (!token) {
    return res.json({ Message: "necesitas un token" });
  } else {
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decode) => {
      //console.log(decode);
      if (err) {
        return res.json({ Message: "error de autenticacion" });
      } else {
        req.user = decode.user;
        next();
      }
    });
  }
};
//rutas para las api empenos
app.get("/empenos", verifyUser, (req, res) => {
  const userId = req?.user?.id;
  //console.log("ruta usuario", userId);
  // Realiza una consulta en la base de datos para obtener los datos del usuario usando el ID
  const sql = "SELECT * FROM ot_pawn WHERE user_id = ?";
  connection.query(sql, [userId], (err, userData) => {
    if (err) {
      return res.status(500).json({ error: "Error en el servidor" });
    }

    if (userData.length > 0) {
      return res.json({ status: "Success", data: userData });
    } else {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
  });
});
//mostrar usuarios
app.get("/usuario", verifyUser, (req, res) => {
  const userId = req?.user?.id;
  //console.log("ruta usuario", userId);
  // Realiza una consulta en la base de datos para obtener los datos del usuario usando el ID
  const sql = "SELECT name, email FROM ot_customer WHERE id = ?";
  connection.query(sql, [userId], (err, userData) => {
    if (err) {
      return res.status(500).json({ error: "Error en el servidor" });
    }

    if (userData.length > 0) {
      return res.json({ status: "Success", data: userData });
    } else {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
  });
});

//api para login
app.post("/login", (req, res) => {
  const sql = "SELECT * FROM ot_customer WHERE email = ?";
  connection.query(sql, [req.body.correo], async (err, data) => {
    if (err) return res.json({ Message: "Error del servidor" });
    if (data.length === 0) {
      //console.log(data);
      return res.json({ Message: "No existe usuario" });
    } else {
      try {
        const match = await bcrypt.compare(req.body.password, data[0].password);

        if (match) {
          const user = {
            id: data[0].id,
            email: data[0].email,
            // Agrega otros datos del usuario si los necesitas
          };

          const token = jwt.sign({ user }, process.env.TOKEN_SECRET, {
            expiresIn: "1h",
          });

          return res.json({
            status: "Success",
            message: "Token generado correctamente",
            token: token,
            user: user,
          });
        } else {
          return res.json({ Message: "Contraseña incorrecta" });
        }
      } catch (error) {
        console.error("Error al comparar contraseñas:", error);
        return res.json({ Message: "Error al comparar contraseñas" });
      }
    }
  });
});
// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
