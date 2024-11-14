const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupSchema = Schema({
  nom: {
    type: String,
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
    index: true,
  },
  date_creation: {
    type: Date,
    default: Date.now,
    index: true,
  },
  createur_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
});

groupSchema.index({ nom: 1 });
groupSchema.index({ createur_id: 1 });
groupSchema.index({ date_creation: 1 });
groupSchema.index({ nom: "text", description: "text" }); //recherche full-text

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
