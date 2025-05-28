const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { kid } = require("./util");

//Pivate and public keys path
const publicKey = fs.readFileSync(
  path.join(__dirname, "../auth/keys/public.key"),
  "utf8"
);


router.get("/", (req, res) => {
  const publicJWK = {
    keys: [
      {
        kty: "RSA",
        kid, 
        use: "sig", 
        alg: "RS256",
        n: publicKey
          .match(
            /(?:-----BEGIN PUBLIC KEY-----)(.*)(?:-----END PUBLIC KEY-----)/s
          )[1]
          .replace(/\n/g, ""),
        e: "AQAB", 
      },
    ],
  };
  res.json(publicJWK);
});
module.exports = router;
