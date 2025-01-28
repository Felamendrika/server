const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupSchema = Schema(
  {
    nom: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
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
  },
  { timestamps: true }
);

groupSchema.pre("remove", async function (next) {
  await Membre.deleteMany({ group_id: this._id });
  next();
});

groupSchema.index({ nom: 1 }, { unique: 1 });
groupSchema.index({ createur_id: 1 });
groupSchema.index({ date_creation: 1 });
groupSchema.index({ nom: "text" }); //recherche full-text

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
