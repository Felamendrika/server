const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    date_debut: {
      type: Date,
      required: true,
    },
    date_fin: {
      type: Date,
      required: true,
    },
    createur_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

eventSchema.index({ titre: 1 }, { unique: true });
eventSchema.index({ description: 1 });
eventSchema.index({ titre: "text", description: "text" });

// validate sur date_debut et date_fin pour que date_debut < date_fin
eventSchema.pre("save", function (next) {
  if (this.date_debut >= this.date_fin) {
    return next(new Error("La date de debut doit etre avant la date de fin"));
  }
  next();
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
