const bcrypt = require("bcrypt");

async function testHash() {
  const password = "qwerty"; // Remplacez par le mot de passe que vous avez utilisé lors de la création de l'utilisateur
  const hashFromDb =
    "$2b$10$15LY0iSjI1j.QcFSVnQhX.9r0Coepw/nP5m5KV6ARpIXLNEAHsc9a"; // Remplacez par le hash récupéré depuis la DB

  const isValid = await bcrypt.compare(password, hashFromDb);
  console.log("Le mot de passe est valide :", isValid);
}

testHash();
