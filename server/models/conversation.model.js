const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      required: true,
      index: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.type === "private";
      },
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.type === "private";
      },
    },
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: function () {
        return this.type === "group";
      },
      index: true,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ type: 1 });
conversationSchema.index({ sender_id: 1 });
conversationSchema.index({ receiver_id: 1 });
conversationSchema.index({ group_id: 1 });

// Middleware pré-suppression
conversationSchema.pre("remove", async function (next) {
  // Supprimer tous les messages associés
  await this.model("Message").deleteMany({ conversation_id: this._id });
  next();
});

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = Conversation;
