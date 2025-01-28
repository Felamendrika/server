const mongoose = require("mongoose");
const User = require("../models/user.model");
const bcrypt = require("bcrypt");
require("dotenv").config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log("Erreur lors de la connexion", err));

async function migrationPasswords() {
  try {
    const users = await User.find({});
    console.log(`Migration de ${users.length} utilisateurs...`);

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.mdp, 10);
      await User.findByIdAndUpdate(user._id, { mdp: hashedPassword });
      console.log(`Mot de passe de ${user.pseudo} migré avec succès.`);
    }

    console.log("Migration terminée avec succès.");
    process.exit(0);
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    process.exit(1);
  }
}

migrationPasswords();
