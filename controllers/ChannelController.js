import mongoose from "mongoose";
import Channel from "../models/ChannelModal.js";
import User from "../models/UserModal.js";

export const createChannel = async (req, res) => {
  try {
    const { name, members } = req.body;
    const userid = req.userId;
    // console.log({ userid });
    const admin = await User.findById(userid);
    // console.log({ admin });
    if (!admin) {
      return res.status(400).send("Admin User not found");
    }

    const validMembers = await User.find({ _id: { $in: members } });

    if (validMembers.length !== members.length) {
      return res.status(400).send("Some members are not valid users");
    }

    const newChannel = new Channel({
      name,
      members,
      admin: userid,
    });

    await newChannel.save();

    return res.status(201).json({ channel: newChannel });
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};

export const getUserChannel = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const channels = await Channel.find({
      $or: [{ admin: userId }, { members: userId }],
    }).sort({ updatedAt: -1 });

    return res.status(201).json({ channels });
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};

export const getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    // console.log({channelId})
    const channel = await Channel.findById(channelId).populate({
      path: "messages",
      populate: {
        path: "sender",
        select: "_id email firstName lastName image color",
      },
    });
    if (!channel) {
      return res.status(404).send("Channel not found");
    }

    const messages = channel.messages;

    return res.status(201).json({ messages });
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};
