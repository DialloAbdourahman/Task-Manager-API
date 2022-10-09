const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Email is invalid');
        }
      },
    },
    password: {
      type: String,
      trim: true,
      required: true,
      minlength: 7,
      validate(value) {
        if (value.toLowerCase().includes('password')) {
          throw new Error('Password must not contain the word "password"');
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error('Age must be a positive number');
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer, // this is binary data.
    },
  },
  {
    timestamps: true,
  }
);

//We must not create a field for this we instead create a virtual field, it should just be a reference else we are just duplicating data.
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner',
});

// This is instance method because it is accesible only on the instance
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// when we pass an object to res.send(), it calls json.stringify() behind the scenes. so here, we are manipulating the json.stringify() of the users model using the toJSON() to return only what we want.
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar; // we don't have to show the user avatar profile since we already have a url that serves it

  return userObject;
};

// This is a model method cause we call it on the model itself and it leaves in the statics
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('Unable to login');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error('Unable to login');
  }

  return user;
};

// Here, this fuction will run just before a user is saved. we can also have post function that can run when a user is saved for example. Certain moongose queries by passes somes advanced futures like middleware e.g findByIdAndUpdate() type of query. That is even why we have to set somes options like runValidators for it to even consider validations because it executes directly on the database.
// this is middleware
userSchema.pre('save', async function (next) {
  const user = this;

  // test if the user's password has been modified.
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

// Delete user's tasks when user is removed.
userSchema.pre('remove', async function (next) {
  const user = this;

  await Task.deleteMany({ owner: user._id });

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
