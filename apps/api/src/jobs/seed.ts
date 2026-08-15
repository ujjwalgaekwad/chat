import { connectMongo, disconnectMongo } from "../config/db";
import { User } from "../models/User";
import { Conversation } from "../models/Conversation";
import { ConversationMember } from "../models/ConversationMember";
import { Message } from "../models/Message";
import { RefreshToken } from "../models/RefreshToken";

async function seed() {
  await connectMongo();
  console.log("Connected. Wiping existing app data...");

  await Promise.all([
    User.deleteMany({}),
    Conversation.deleteMany({}),
    ConversationMember.deleteMany({}),
    Message.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);

  console.log("Database reset complete. Create accounts through the register flow.");

  await disconnectMongo();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
