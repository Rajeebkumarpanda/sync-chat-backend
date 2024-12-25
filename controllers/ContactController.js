import mongoose from "mongoose"; // Ensure mongoose is imported to handle ObjectId
import User from "../models/UserModal.js";
import Message from "../models/MessagesModal.js";

export const searchContacts = async (req, res) => {
  try {
    const { searchTerm } = req.body;
    // console.log("Search Term:", searchTerm, req.userId);

    if (!searchTerm) {
      return res.status(400).send("Search term is required");
    }

    // Escape any special characters in the search term for the regex
    const sanitizeSearchTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const regex = new RegExp(sanitizeSearchTerm, "i");

    // console.log("Regex:", regex);

    // Check if req.userId is a valid ObjectId before using it in the query
    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      return res.status(400).send("Invalid user ID");
    }

    const contacts = await User.find({
      $or: [
        { email: { $regex: regex } },
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
      ],
    });

    // console.log("Contacts Found:", contacts);

    return res.status(200).json({ contacts });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal server error");
  }
};

export const getContactsForDMList = async (req, res) => {
  try {
    let { userId } = req;

    userId = new mongoose.Types.ObjectId(userId);

    const contacts = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", userId] },
              then: "$recipient",
              else: "$sender",
            },
          },
          lastMessageTime: { $first: "$timestamp" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "contactInfo",
        },
      },
      {
        $unwind: "$contactInfo",
      },
      {
        $project: {
          _id: 1,
          email: "$contactInfo.email",
          firstName: "$contactInfo.firstName",
          lastName: "$contactInfo.lastName",
          image: "$contactInfo.image",
          color: "$contactInfo.color",
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);

    return res.status(200).json({ contacts });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal server error");
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.userId } },
      "firstName lastName _id"
    );

    const contacts=users.map((user)=>({
      label:user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
      value:user._id
    }))


    return res.status(200).json({ contacts });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal server error");
  }
};
