const express = require("express");
const dotenv = require("dotenv");

const publicKeyRoute = require("./routes/auth/publicKeyRoute");
const loginRoute = require("./routes/auth/loginRoute");

dotenv.config();


const app = express();

app.use(express.json());


app.use("/.well-known/jwks.json", publicKeyRoute);


app.use("/api/login", loginRoute);


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Auth Server running on port ${PORT}`);
});
