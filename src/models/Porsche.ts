
import mongoose from "mongoose";

const FactorySchema = new mongoose.Schema({
  id: String,
  name: String,
  location: String,
  founded: Number,
  logoUrl: String,
  isElectricCertified: Boolean
});

const PorscheSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  price: Number,
  isAvailable: Boolean,
  releaseDate: String,
  imageUrl: String,
  category: String,
  features: [String],
  factory: FactorySchema
});

export default mongoose.model("Porsche", PorscheSchema);
