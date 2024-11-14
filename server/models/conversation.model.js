const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
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
});

conversationSchema.index({ type: 1 });
conversationSchema.index({ sender_id: 1 });
conversationSchema.index({ receiver_id: 1 });
conversationSchema.index({ group_id: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = Conversation;
