import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    bio: { type: String, default: '', maxlength: 280 },
    avatarUrl: { type: String, default: null },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    role: this.role,
    createdAt: this.createdAt,
  };
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
};

export const User = mongoose.model('User', userSchema);
