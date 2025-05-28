const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // For password hashing

//Professor Schema
const professorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, 
  },
  phone: {
    type: String,
    required: true,
    unique: true, 
  },
  password: {
    type: String,
    required: true, 
  },
});


professorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); 
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


professorSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const Professor = mongoose.model("Professor", professorSchema);

module.exports = Professor;
