import Message from "../models/MessagesModal.js";
import { mkdirSync, renameSync } from "fs";

export const getMessages = async (req, res) => {
  try {
    const user1 = req.userId;
    const user2 = req.body.id;

    // console.log({user1}, {user2});

    if (!user1 || !user2) {
      return res.status(404).send("both user id are required");
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
    }).sort({ timestamp: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal server error");
  }
};

export const uploadFiles = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(404).send("No file found");
    }
    const date = Date.now();
    let fileDir = `uploads/files/${date}`;
    let fileName = `${fileDir}/${req.file.originalname}`;

    mkdirSync(fileDir, { recursive: true });
    renameSync(req.file.path, fileName);

    return res.status(200).json({ filePath: fileName });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal server error");
  }
};
