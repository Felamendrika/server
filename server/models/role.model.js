const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["admin", "membre"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Role = mongoose.model("Role", roleSchema);

module.exports = Role;
