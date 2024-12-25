import { compare } from "bcrypt";
import User from "../models/UserModal.js";
import jwt from "jsonwebtoken";
import { renameSync, unlinkSync } from "fs";

const maxAge = 3 * 24 * 60 * 60 * 1000;
const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_KEY, {
    expiresIn: maxAge,
  });
};

export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send("email and password required");
    }
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "email already exist" });
    }
    const user = await User.create({ email, password });
    res.cookie("jwt", createToken(email, user._id), {
      maxAge,
      secure: true,
      sameSize: "none",
    });
    return res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        profileSetup: user.profileSetup,
      },
    });
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send("email and password required");
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("user not found");
    }
    // console.log({user})
    const auth = await compare(password, user.password);
    // console.log({auth})
    if (!auth) {
      return res.status(400).send("password is not valid");
    }
    res.cookie("jwt", createToken(email, user._id), {
      maxAge,
      secure: true,
      sameSize: "none",
    });
    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
      },
    });
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};

export const getUserInfo = async (req, res) => {
  try {
    const user = await User.findById({ _id: req.userId });
    if (!user) {
      return res.status(404).send("user with the given id does not exist");
    }
    return res.status(200).json({
      id: user._id,
      email: user.email,
      profileSetup: user.profileSetup,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      color: user.color,
    });
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req;
    const { firstName, lastName, color } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).send("firstName,lastName and color is required");
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, color, profileSetup: true },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      id: user._id,
      email: user.email,
      profileSetup: user.profileSetup,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      color: user.color,
    });
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};

export const addProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("file is required");
    }

    const date = Date.now();
    let filename = "uploads/profiles/" + date + req.file.originalname;
    renameSync(req.file.path, filename);

    const user = await User.findByIdAndUpdate(
      req.userId,
      { image: filename },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      image: user.image,
    });
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};

export const removeProfileImage = async (req, res) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("user with the given id does not exist");
    }

    if (user.image) {
      unlinkSync(user.image);
    }
    user.image = null;
    await user.save();

    return res.status(200).send("profile image removed successfully");
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 1, secure: true,sameSize:"None" });

    return res.status(200).send("Logout successfully");
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};
