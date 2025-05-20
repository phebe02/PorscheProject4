
import mongoose from "mongoose";

const FactorySchema = new mongoose.Schema({
  id: String,
  name: String,
  location: String,
  founded: Number,
  logoUrl: String,
  isElectricCertified: Boolean
});

export default mongoose.model("Factory", FactorySchema);
