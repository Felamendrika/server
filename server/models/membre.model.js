const mongoose = require("mongoose");

const membreSchema = mongoose.Schema({
  date_join: {
    type: Date,
    default: Date.now,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
});

membreSchema.index({ group_id: 1 });
membreSchema.index({ user_id: 1 });
membreSchema.index({ role_id: 1 });

const Membre = mongoose.model("Membre", membreSchema);

module.exports = Membre;
