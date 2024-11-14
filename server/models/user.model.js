// importation de mongoose
const mongoose = require("mongoose");

// definition et configuration du stucture de schema
const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    prenom: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    pseudo: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    mdp: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: false,
    },
    date_inscription: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexation pour ameliorer la recherche
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ nom: 1 });
userSchema.index({ pseudo: 1 });
userSchema.index({ date_inscription: 1 });
userSchema.index({ nom: "text", pseudo: "text" }); // Recherche full-text

const User = mongoose.model("User", userSchema);

module.exports = User;
