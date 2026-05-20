import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    maxlength: [60, "Name cannot be more than 60 characters"],
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
  },
  role: {
    type: String,
    enum: ["customer", "employee", "admin"],
    default: "customer",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Avoid Recompilation Error in Next.js
export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
