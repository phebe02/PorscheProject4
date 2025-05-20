
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, enum: ["ADMIN", "USER"], default: "USER" }
});

export default mongoose.model("User", UserSchema);
