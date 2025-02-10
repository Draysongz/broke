const { Telegraf } = require("telegraf");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const web3 = require("@solana/web3.js");
const splToken = require("@solana/spl-token");
const bs58 = require("bs58");

const bot = new Telegraf(process.env.BOT_TOKEN);

const brokeStatuses = [
  "You're so broke, your wallet has cobwebs! 🕸️",
  "Found $2 on the street - it's your lucky day! 🍀",
  "Your bank account is playing hide and seek... and winning! 🙈",
  "You're so broke, your piggy bank filed for bankruptcy! 🐷",
  "Balance: $0.69 - Nice... but also sad 😢",
  "Your credit score is lower than your ex's standards 📉",
  "You're not broke, you're just financially challenged! 🎭",
  "Your wallet is lighter than your hopes and dreams 💫",
  "You're so broke, you can't even pay attention! 📚",
  "Your bank account needs life support 🏥",
  "You're so broke, even your dreams are on clearance! 🏷️",
  "Your bank account is playing dead... very convincingly 💀",
  "Found a penny, doubled your net worth! 🪙",
  "Your wallet is emptier than your DMs 📱",
  "You're so broke, you're window shopping at the Dollar Store 🏪",
  "Your credit card got denied by a vending machine 🤖",
  "Living that cardboard box lifestyle in style! 📦",
  "Your bank statements are just fancy IOUs 📄",
  "You're so broke, your echo can't afford to come back 🗣️",
  "Your financial plan is finding money in the couch 🛋️",
  "Even your calculator shows 'ERROR' when checking your balance 🧮",
  "You're so broke, you're selling air guitars on eBay 🎸",
  "Your wallet is in airplane mode - nothing's coming in or out ✈️",
  "You're not broke, you're just pre-wealthy! 🌱",
  "Your bank account has more zeros than a binary code 🔢",
  "You're so broke, your monopoly money looks valuable 🎲",
  "Your financial advisor just prescribed antidepressants 💊",
  "Even your imaginary friend won't lend you money 🫂",
  "Your portfolio is just screenshots of other people's gains 📱",
  "You're so broke, you're getting declined by free trials 🚫",
];

const rouletteResults = {
  win: [
    "🎰 JACKPOT! Your luck is better than your bank balance!",
    "💫 The broke gods have smiled upon you!",
    "🌟 Look who's not so broke anymore!",
    "🎲 Even your debt collector would be proud!",
    "🌈 Fortune favors the broke today!",
    "🎯 Bullseye! Your aim is better than your financial planning!",
    "🎪 Step right up! We have a winner!",
    "🎨 You're painting yourself out of poverty!",
    "🎭 Plot twist: You're actually winning!",
    "🎪 The circus of luck is in your favor!",
    "🌟 Shining brighter than your credit score!",
    "🎲 Rolling in points (if not in money)!",
    "🎯 Hit the jackpot like you hit rock bottom!",
    "🎨 Masterfully played, you broke artist!",
    "🎭 From rags to slightly better rags!",
    "🎪 The greatest show of luck on earth!",
    "🌟 Your luck is inversely proportional to your wealth!",
    "🎲 Defying the odds (and your bank balance)!",
    "🎯 Straight to the bank (if you had one)!",
    "🎨 A beautiful victory in your broke journey!",
    "🎭 Playing the part of a winner perfectly!",
    "🎪 Step aside poverty, winner coming through!",
    "🌟 Sparkling success in your sea of debt!",
    "🎲 Lucky break for the perpetually broke!",
  ],
  lose: [
    "📉 Aaaand it's gone! Just like your savings!",
    "💸 You've unlocked: Ultra Broke Mode!",
    "🕳️ Digging that hole deeper, aren't we?",
    "🎲 The house always wins, and you're still broke!",
    "🌪️ That's a financial tornado you just walked into!",
    "🎭 Plot twist: You're even more broke now!",
    "🎪 The circus called, they want their broke clown back!",
    "🌟 Shining example of how NOT to gamble!",
    "🎲 Rolling snake eyes on your bank balance!",
    "🎯 Missing the target like you miss having money!",
    "🎨 Painting a masterpiece of misfortune!",
    "🎭 From rags to... even more rags!",
    "🎪 The greatest financial flop show on earth!",
    "🌟 Your wallet's getting lighter than helium!",
    "🎲 Betting: The speedrun to bankruptcy!",
    "🎯 Bulls-eye on your empty pockets!",
    "🎨 A beautiful disaster in the making!",
    "🎭 Playing the role of 'Broke' perfectly!",
    "🎪 Step right up to see the disappearing points trick!",
    "🌟 Sparkling failure at its finest!",
  ],
};

const ADMIN_IDS = ["2146305061", "6561256541"]; // Add your Telegram ID here

const SOLANA_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY;
const BROKE_TOKEN_ADDRESS = process.env.BROKE_TOKEN_ADDRESS;

const RUMBLE_DURATION = 30; // seconds to join
const MIN_PLAYERS = 2;
const ELIMINATION_DELAY = 3; // seconds between eliminations
let activeRumble = null;

const DAILY_ROULETTE_LIMIT = 30;

bot.start(async (ctx) => {
  const username = ctx.from.username;
  const tgId = ctx.from.id.toString();
  const user = await prisma.user.findUnique({
    where: {
      tgId: tgId,
    },
  });

  const instructionsText =
    `🎮 Commands & Rewards:\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `🎲 /howbrokeami - Check your daily broke status (+10000 points)\n` +
    `📊 /leaderboard - See the brokest of the broke\n` +
    `🎰 /brokeroulette - Gamble your points (if you dare)\n\n` +
    `🏆 /brokerumble - Join the broke rumble (25000 points)\n\n` +
    `💫 How to Earn Points:\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `➤ Daily broke check: +10000 points\n` +
    `➤ Get reactions: +2500 points each\n\n` +
    `💎 Weekly Token System:\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `⏰ Every Sunday:\n` +
    `➤ Points convert to Broke Tokens\n` +
    `➤ Rate: 1 point = 1 $BROKE\n` +
    `➤ Points reset after conversion\n` +
    `➤ Tokens are forever! 🌟`;

  if (!user) {
    await prisma.user.create({
      data: {
        tgId: tgId,
        username: username || ctx.from.first_name || "",
      },
    });
    ctx.reply(
      `👋 Hello ${username}! You are now a registered brokie! 🎉\n\n` +
        `📊 Here are your starting stats:\n` +
        `💸 Broke Tokens: 0\n` +
        `🏆 Broke Points: 0\n` +
        `💸 Broke Status: No broke status found\n\n` +
        instructionsText
    );
  } else {
    ctx.reply(
      `👋 Welcome back, @${username}! 🎉\n\n` +
        `📊 Here are your stats:\n` +
        `💸 Broke Tokens: ${user.brokeTokens}\n` +
        `🏆 Broke Points: ${user.leaderboardPoints}\n` +
        `💸 Broke Status: ${user.brokeStatus || "No broke status found"}\n\n` +
        instructionsText
    );
  }
});

// Helper function to log activity with more details
async function logActivity(
  userId,
  type,
  action,
  amount,
  previousBalance,
  metadata = {}
) {
  try {
    await prisma.activity.create({
      data: {
        userId,
        type,
        action,
        amount,
        previousBalance,
        newBalance: previousBalance + amount,
        metadata,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

// Helper function to check and reset daily roulettes
async function checkRouletteLimit(user) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Reset counter if it's a new day
  if (!user.lastRouletteReset || user.lastRouletteReset < today) {
    await prisma.user.update({
      where: { tgId: user.tgId },
      data: {
        dailyRoulettes: 0,
        lastRouletteReset: now,
      },
    });
    return true;
  }

  // Check if user has reached limit
  return user.dailyRoulettes < DAILY_ROULETTE_LIMIT;
}

bot.command("howbrokeami", async (ctx) => {
  const tgId = ctx.from.id.toString();
  const user = await prisma.user.findUnique({
    where: { tgId: tgId },
  });

  if (!user) {
    return ctx.reply("Please use /start@brokiesbrokebot to register first! 📝");
  }

  // Check if 24 hours have passed since last check
  const now = new Date();
  const lastCheck = user.lastBrokeCheck;
  const timeDiff = lastCheck ? now - lastCheck : null;
  const hoursLeft = lastCheck ? Math.ceil(24 - timeDiff / (1000 * 60 * 60)) : 0;

  if (lastCheck && timeDiff < 24 * 60 * 60 * 1000) {
    return ctx.reply(
      `⏳ Hold up! You need to wait ${hoursLeft} more hours before checking again!\n\n` +
        `Current broke status: ${user.brokeStatus}`
    );
  }

  // Generate new broke status
  const newStatus =
    brokeStatuses[Math.floor(Math.random() * brokeStatuses.length)];
  const pointsEarned = 10000;
  const previousBalance = user.leaderboardPoints;

  // Send status message and store the message ID
  const statusMessage = await ctx.reply(
    `🎲 Your Broke Status of the Day:\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `${newStatus}\n\n` +
      `✨ You earned ${pointsEarned} points!\n` +
      `📊 Total points: ${user.leaderboardPoints + pointsEarned}\n` +
      `💸 Broke Tokens: ${user.brokeTokens}\n\n` +
      `Come back in 24 hours for a new status! ⏰`
  );

  console.log("Status message:", statusMessage); // Debug log

  // Update user with new status and message ID
  await prisma.user.update({
    where: { tgId: tgId },
    data: {
      brokeStatus: newStatus,
      lastBrokeCheck: now,
      leaderboardPoints: previousBalance + pointsEarned,
      lastStatusMessageId: statusMessage.message_id.toString(),
    },
  });

  // Log activity
  await logActivity(
    user.id,
    "daily_check",
    "earned",
    pointsEarned,
    previousBalance,
    {
      status: newStatus,
      timestamp: now,
    }
  );
});

bot.command("leaderboard", async (ctx) => {
  try {
    // Get top 10 users by points and tokens
    const users = await prisma.user.findMany({
      orderBy: [{ leaderboardPoints: "desc" }, { brokeTokens: "desc" }],
      take: 10,
    });

    if (users.length === 0) {
      return ctx.reply("No brokies found in the leaderboard yet! 😢");
    }

    // Create leaderboard message
    let leaderboardMsg = `🏆 Brokies Leaderboard\n` + `━━━━━━━━━━━━━━━━━\n\n`;

    users.forEach((user, index) => {
      const medal =
        index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅";
      leaderboardMsg +=
        `${medal} ${index + 1}. @${user.username}\n` +
        `   ┗━ 💫 ${user.leaderboardPoints} points | 💸 ${user.brokeTokens} $BROKE\n`;
    });

    // Get requesting user's rank
    const tgId = ctx.from.id.toString();
    const userRank = await prisma.user.count({
      where: {
        OR: [
          {
            leaderboardPoints: {
              gt: users.find((u) => u.tgId === tgId)?.leaderboardPoints || 0,
            },
          },
          {
            AND: [
              {
                leaderboardPoints: {
                  equals:
                    users.find((u) => u.tgId === tgId)?.leaderboardPoints || 0,
                },
              },
              {
                tgId: {
                  lt: tgId,
                },
              },
            ],
          },
        ],
      },
    });

    const userStats = await prisma.user.findUnique({
      where: { tgId },
    });

    if (userStats) {
      leaderboardMsg +=
        `\n━━━━━━━━━━━━━━━━━\n` +
        `📊 Your Position:\n` +
        `#${userRank + 1}. @${userStats.username}\n` +
        `   ┗━ 💫 ${userStats.leaderboardPoints} points | 💸 ${userStats.brokeTokens} $BROKE\n\n` +
        `Next points conversion in: ${getNextSundayCountdown()} ⏳`;
    }

    ctx.reply(leaderboardMsg);
  } catch (error) {
    console.error("Leaderboard error:", error);
    ctx.reply("Failed to fetch leaderboard. Please try again later! 😅");
  }
});

// Helper function to get countdown to next Sunday
function getNextSundayCountdown() {
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + (7 - now.getDay()));
  nextSunday.setHours(0, 0, 0, 0);

  const diff = nextSunday - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return `${days}d ${hours}h`;
}

// Register bot commands
const commands = [
  {
    command: "start",
    description: "Register as a brokie and get started 📝",
  },
  {
    command: "howbrokeami",
    description: "Check your daily broke status 🎲",
  },
  {
    command: "leaderboard",
    description: "See the brokest of the broke 📊",
  },
  {
    command: "brokeroulette",
    description: "Gamble your broke points 🎲",
  },
  {
    command: "addpoints",
    description: "Admin command to add points ",
    hide: true,
  },
  {
    command: "setaddress",
    description: "Set your Solana wallet address 💳",
  },
  {
    command: "withdraw",
    description: "Withdraw your $BROKE tokens 💸",
  },
  {
    command: "processwithdraw",
    description: "Process withdrawal requests 💼",
    hide: true,
  },
  {
    command: "brokerumble",
    description: "Join the broke rumble (25000 points) 🏆",
  },
];

// Set commands when bot starts
bot.telegram
  .setMyCommands(commands.filter((cmd) => !cmd.hide))
  .then(() => {
    console.log("Bot commands registered successfully! 🚀");
  })
  .catch((error) => {
    console.error("Failed to register bot commands:", error);
  });

// Weekly token conversion function
async function convertPointsToTokens() {
  try {
    // Get all users with points
    const users = await prisma.user.findMany({
      where: {
        leaderboardPoints: {
          gt: 0,
        },
      },
    });

    for (const user of users) {
      const tokensEarned = user.leaderboardPoints;
      if (tokensEarned > 0) {
        await prisma.user.update({
          where: { tgId: user.tgId },
          data: {
            brokeTokens: user.brokeTokens + tokensEarned,
            leaderboardPoints: 0,
          },
        });

        // Notify user about conversion
        try {
          await bot.telegram.sendMessage(
            user.tgId,
            `💰 Weekly Token Conversion:\n` +
              `━━━━━━━━━━━━━━━━━\n` +
              `✨ ${user.leaderboardPoints} points converted!\n` +
              `💸 You earned ${tokensEarned} $BROKE tokens\n` +
              `📊 Points reset to 0\n\n` +
              `Keep grinding, brokie! 💪`
          );
        } catch (error) {
          console.error(`Failed to notify user ${user.tgId}:`, error);
        }
      }
    }
    console.log("Weekly token conversion completed successfully! 🎉");
  } catch (error) {
    console.error("Token conversion error:", error);
  }
}

// Schedule weekly token conversion (every Sunday at 00:00)
const schedule = require("node-schedule");
schedule.scheduleJob("0 0 * * 0", convertPointsToTokens);

bot.telegram.deleteWebhook(); // Ensure webhook is removed
bot.launch({
  allowedUpdates: ["message", "message_reaction"],
  webhook: {
    domain: "https://broke-za2z.onrender.com",
    port: process.env.PORT || 3000,
  },
});

// bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// Roulette configuration
const ROULETTE_CONFIG = {
  multipliers: [
    { value: 5, chance: 0.02 }, // 2%
    { value: 3, chance: 0.08 }, // 8%
    { value: 2, chance: 0.25 }, // 25%
    { value: 1.5, chance: 0.15 }, // 15%
    { value: 0, chance: 0.5 }, // 50%
  ],
};

// Controlled RNG for roulette
function getRouletteOutcome() {
  // Force 50% chance of losing first
  const willLose = Math.random() < 0.5;
  if (willLose) {
    return { value: 0, chance: 0.5 };
  }

  // If not losing, distribute the wins according to their relative probabilities
  const winRand = Math.random() * 0.5; // Scale to remaining 50%

  // Relative probabilities within winning outcomes
  if (winRand < 0.04) return { value: 5, chance: 0.02 }; // 4% of 50% = 2% total
  if (winRand < 0.2) return { value: 1, chance: 0.08 }; // 16% of 50% = 8% total
  if (winRand < 0.4) return { value: 2, chance: 0.15 }; // 30% of 50% = 15% total
  return { value: 0.5, chance: 0.25 }; // 50% of 50% = 25% total
}

// Update the brokeroulette command
bot.command("brokeroulette", async (ctx) => {
  try {
    const tgId = ctx.from.id.toString();
    const user = await prisma.user.findUnique({
      where: { tgId: tgId },
    });

    if (!user) {
      return ctx.reply("Please use /start to register first!");
    }

    // Check if user is admin
    const isAdmin = ADMIN_IDS.includes(tgId);

    // Check roulette limit for non-admins
    if (!isAdmin) {
      const canPlay = await checkRouletteLimit(user);
      if (!canPlay) {
        const nextReset = new Date();
        nextReset.setDate(nextReset.getDate() + 1);
        nextReset.setHours(0, 0, 0, 0);
        const timeLeft = nextReset - new Date();
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor(
          (timeLeft % (1000 * 60 * 60)) / (1000 * 60)
        );

        return ctx.reply(
          `❌ Daily roulette limit reached!\n\n` +
            `You've played ${DAILY_ROULETTE_LIMIT} times today.\n` +
            `Time until reset: ${hoursLeft}h ${minutesLeft}m\n\n` +
            `💫 Try again tomorrow!`
        );
      }
    }

    // Get bet amount from command arguments
    const args = ctx.message.text.split(" ");
    const betAmount = parseInt(args[1]);

    // Validate bet amount
    if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
      return ctx.reply(
        `❌ Please specify a valid bet amount!\n\n` +
          `Usage: /brokeroulette <amount>\n\n` +
          `🎲 Odds:\n` +
          `• 2% chance to win 5x your bet\n` + 
          `• 8% chance to win 1x your bet\n` +
          `• 15% chance to win 2x your bet\n` +
          `• 25% chance to win 0.5x your bet\n` +
          `• 50% chance to lose your bet\n\n` +
          `Current points: ${user.leaderboardPoints} 💫`
      );
    }

    if (betAmount > user.leaderboardPoints) {
      return ctx.reply(
        `❌ You can't bet more than you have!\n` +
          `Your current points: ${user.leaderboardPoints} 💫`
      );
    }

    // Get outcome
    const outcome = getRouletteOutcome();
    const multiplier = outcome.value;
    const won = multiplier > 0;

    // Calculate point change
    const pointChange = won
      ? Math.floor(betAmount * multiplier) - betAmount // Subtract original bet if won
      : -betAmount; // Lose bet amount

    const previousBalance = user.leaderboardPoints;

    // Update user points
    await prisma.user.update({
      where: { tgId: tgId },
      data: {
        leaderboardPoints: {
          increment: pointChange,
        },
      },
    });

    // Generate result message
    const resultMessage = won
      ? rouletteResults.win[
          Math.floor(Math.random() * rouletteResults.win.length)
        ]
      : rouletteResults.lose[
          Math.floor(Math.random() * rouletteResults.lose.length)
        ];

    // After successful roulette, increment counter for non-admins
    if (!isAdmin) {
      await prisma.user.update({
        where: { tgId: user.tgId },
        data: {
          dailyRoulettes: {
            increment: 1,
          },
        },
      });
    }

    // Add remaining plays to result message for non-admins
    const playsLeft = isAdmin
      ? "∞"
      : DAILY_ROULETTE_LIMIT - (user.dailyRoulettes + 1);

    await ctx.reply(
      `🎲 BROKE ROULETTE RESULT 🎲\n` +
        `━━━━━━━━━━━━━━━━━\n\n` +
        `${resultMessage}\n\n` +
        `Bet: ${betAmount} points\n` +
        `${won ? `Multiplier: ${multiplier}x\n` : ""}` +
        `${
          won
            ? `Won: ${pointChange + betAmount} points\n`
            : "Lost: " + betAmount + " points\n"
        }` +
        `New balance: ${previousBalance + pointChange} points 💫\n\n` +
        `Plays remaining today: ${playsLeft}`
    );

    // Log activity
    await logActivity(
      user.id,
      "roulette",
      won ? "won" : "lost",
      pointChange,
      previousBalance,
      {
        betAmount,
        multiplier,
        outcome: won ? "win" : "lose",
        timestamp: new Date(),
        finalBalance: previousBalance + pointChange,
      }
    );
  } catch (error) {
    console.error("Roulette error:", error);
    ctx.reply("❌ Something went wrong! Please try again later.");
  }
});

// Add the admin command
bot.command("addpoints", async (ctx) => {
  try {
    const adminId = ctx.from.id.toString();

    // Check if user is admin
    if (!ADMIN_IDS.includes(adminId)) {
      return ctx.reply("❌ This command is only for admins!");
    }

    // Parse command arguments: /addpoints @username amount
    const args = ctx.message.text.split(" ");
    if (args.length !== 3) {
      return ctx.reply(
        "❌ Invalid format!\n\n" +
          "Usage: /addpoints @username amount\n" +
          "Example: /addpoints @user 1000"
      );
    }

    // Get username and amount
    const targetUsername = args[1].replace("@", "");
    const amount = parseInt(args[2]);

    if (isNaN(amount)) {
      return ctx.reply("❌ Please specify a valid amount!");
    }

    // Find user by username
    const targetUser = await prisma.user.findFirst({
      where: {
        username: targetUsername,
      },
    });

    if (!targetUser) {
      return ctx.reply(
        "❌ User not found! Make sure they have used /start first."
      );
    }

    // Update user's points
    await prisma.user.update({
      where: {
        tgId: targetUser.tgId,
      },
      data: {
        leaderboardPoints: {
          increment: amount,
        },
      },
    });

    // Notify admin of success
    await ctx.reply(
      `✅ Successfully added ${amount} points to @${targetUsername}!\n` +
        `Their new balance: ${targetUser.leaderboardPoints + amount} points 💫`
    );

    // Notify target user
    try {
      await bot.telegram.sendMessage(
        targetUser.tgId,
        `🎁 Lucky you! An admin gave you ${amount} points!\n` +
          `New balance: ${targetUser.leaderboardPoints + amount} points 💫`
      );
    } catch (error) {
      console.error("Failed to notify target user:", error);
    }
  } catch (error) {
    console.error("Add points error:", error);
    ctx.reply("❌ Something went wrong! Please try again later.");
  }
});

// Add the setaddress command
bot.command("setaddress", async (ctx) => {
  try {
    const tgId = ctx.from.id.toString();

    // Get the Solana address from command
    const args = ctx.message.text.split(" ");
    if (args.length !== 2) {
      return ctx.reply(
        "❌ Please provide your Solana address!\n\n" +
          "Usage: /setaddress <solana_address>\n" +
          "Example: /setaddress 7VHUFJHWu5CWkHVhBhkNKs6Wz4PDhNXVzv8F9fJWjqp1"
      );
    }

    const solanaAddress = args[1];

    // Basic Solana address validation (length and base58 check)
    if (
      solanaAddress.length !== 44 ||
      !/^[1-9A-HJ-NP-Za-km-z]+$/.test(solanaAddress)
    ) {
      return ctx.reply(
        "❌ Invalid Solana address! Please check and try again."
      );
    }

    // Update user's Solana address
    await prisma.user.update({
      where: { tgId },
      data: { solanaAddress },
    });

    ctx.reply(
      `✅ Solana address set successfully!\n\n` +
        `Address: ${solanaAddress}\n\n` +
        `You can now use /withdraw to get your $BROKE tokens!`
    );
  } catch (error) {
    console.error("Set address error:", error);
    ctx.reply("❌ Failed to set address. Please try again later!");
  }
});

const FROM_KEYPAIR = web3.Keypair.fromSecretKey(
  new Uint8Array(bs58.default.decode(SOLANA_PRIVATE_KEY))
);
const QUICKNODE_RPC =
  "https://shy-old-meme.solana-mainnet.quiknode.pro/c5ecdc3056fa2c1b7e3f13d3f0f1cbdc0c583ddb";

// Move connection creation inside the functions that need it
async function getNumberDecimals(mintAddress) {
  const connection = new web3.Connection(QUICKNODE_RPC);
  const info = await connection.getParsedAccountInfo(
    new web3.PublicKey(mintAddress)
  );
  const result = (info.value?.data).parsed.info.decimals;
  return result;
}

async function sendTokens(address, amount) {
  try {
    const connection = new web3.Connection(QUICKNODE_RPC);
    console.log(
      `Sending ${amount} ${BROKE_TOKEN_ADDRESS} from ${FROM_KEYPAIR.publicKey.toString()} to ${address}.`
    );
    //Step 1
    console.log(`1 - Getting Source Token Account`);
    let sourceAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      FROM_KEYPAIR,
      new web3.PublicKey(BROKE_TOKEN_ADDRESS),
      FROM_KEYPAIR.publicKey
    );
    console.log(`    Source Account: ${sourceAccount.address.toString()}`);

    //Step 2
    console.log(`2 - Getting Destination Token Account`);
    let destinationAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      FROM_KEYPAIR,
      new web3.PublicKey(BROKE_TOKEN_ADDRESS),
      new web3.PublicKey(address)
    );
    console.log(
      `    Destination Account: ${destinationAccount.address.toString()}`
    );

    //Step 3
    console.log(
      `3 - Fetching Number of Decimals for Mint: ${BROKE_TOKEN_ADDRESS}`
    );
    const numberDecimals = await getNumberDecimals(BROKE_TOKEN_ADDRESS);
    console.log(`    Number of Decimals: ${numberDecimals}`);

    //Step 4
    console.log(`4 - Creating and Sending Transaction`);
    const tx = new web3.Transaction();
    tx.add(
      splToken.createTransferInstruction(
        sourceAccount.address,
        destinationAccount.address,
        FROM_KEYPAIR.publicKey,
        amount * Math.pow(10, numberDecimals)
      )
    );

    const latestBlockHash = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = await latestBlockHash.blockhash;
    const signature = await web3.sendAndConfirmTransaction(connection, tx, [
      FROM_KEYPAIR,
    ]);
    console.log(
      "\x1b[32m", //Green Text
      `   Transaction Success!🎉`,
      `\n    https://explorer.solana.com/tx/${signature}?cluster=mainnet`
    );
    return signature;
  } catch (error) {
    console.error("Token transfer error:", error);
    throw new Error("Token transfer failed. Please try again later.");
  }
}

// Helper function to check if it's Sunday
function isSunday() {
  return new Date().getDay() === 0;
}

// Add the withdraw command
bot.command("withdraw", async (ctx) => {
  try {
    // Check if it's Sunday
    if (!isSunday()) {
      const nextSunday = getNextSundayCountdown();
      return ctx.reply(
        `❌ Withdrawals are only possible on Sundays!\n\n` +
          `⏳ Next withdrawal window in: ${nextSunday}\n\n` +
          `Note: Your tokens will be converted and available for withdrawal every Sunday.`
      );
    }

    const tgId = ctx.from.id.toString();
    const user = await prisma.user.findUnique({
      where: { tgId },
    });

    if (!user) {
      return ctx.reply("Please use /start first!");
    }

    if (!user.solanaAddress) {
      return ctx.reply(
        "❌ Please set your Solana address first using /setaddress!"
      );
    }

    // Get amount from command
    const args = ctx.message.text.split(" ");
    if (args.length !== 2) {
      return ctx.reply(
        "❌ Please specify amount to withdraw!\n\n" +
          "Usage: /withdraw <amount>\n" +
          "Example: /withdraw 1000\n\n" +
          `Available balance: ${user.brokeTokens} $BROKE`
      );
    }

    const amount = parseInt(args[1]);

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return ctx.reply("❌ Please specify a valid amount!");
    }

    if (amount > user.brokeTokens) {
      return ctx.reply(
        `❌ Insufficient balance!\n` +
          `You only have ${user.brokeTokens} $BROKE tokens.`
      );
    }

    // Send processing message
    await ctx.reply(
      `⏳ Processing your withdrawal...\n` +
        `Amount: ${amount} $BROKE\n` +
        `Address: ${user.solanaAddress}`
    );

    try {
      // Process the transfer
      const signature = await sendTokens(user.solanaAddress, amount);

      // Deduct tokens after successful transfer
      await prisma.user.update({
        where: { tgId },
        data: {
          brokeTokens: {
            decrement: amount,
          },
        },
      });

      // Log activity
      const previousBalance = user.brokeTokens;
      await logActivity(
        user.id,
        "withdraw",
        "withdrew",
        -amount,
        previousBalance,
        {
          solanaAddress: user.solanaAddress,
          transactionHash: signature,
          timestamp: new Date(),
          remainingBalance: previousBalance - amount,
        }
      );

      // Send success message with transaction link
      await ctx.reply(
        `✅ Withdrawal successful!\n\n` +
          `Amount: ${amount} $BROKE\n` +
          `Address: ${user.solanaAddress}\n` +
          `Transaction: https://solscan.io/tx/${signature}\n\n` +
          `New balance: ${user.brokeTokens - amount} $BROKE\n\n` +
          `Next withdrawal window: Next Sunday 00:00 UTC`
      );
    } catch (error) {
      console.error("Withdrawal error:", error);
      await ctx.reply(
        `❌ Withdrawal failed!\n` +
          `Please try again later or contact an admin.\n` +
          `Error: ${error.message}`
      );
    }
  } catch (error) {
    console.error("Withdraw error:", error);
    ctx.reply("❌ Something went wrong! Please try again later.");
  }
});

// Add the admin processwithdraw command
bot.command("processwithdraw", async (ctx) => {
  try {
    const adminId = ctx.from.id.toString();

    // Check if user is admin
    if (!ADMIN_IDS.includes(adminId)) {
      return ctx.reply("❌ This command is only for admins!");
    }

    // Parse command arguments
    const args = ctx.message.text.split(" ");
    if (args.length !== 3) {
      return ctx.reply(
        "❌ Invalid format!\n\n" + "Usage: /processwithdraw <user_id> <amount>"
      );
    }

    const targetId = args[1];
    const amount = parseInt(args[2]);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { tgId: targetId },
    });

    if (!user) {
      return ctx.reply("❌ User not found!");
    }

    // Notify user that withdrawal is being processed
    try {
      await bot.telegram.sendMessage(
        user.tgId,
        `💸 Your withdrawal of ${amount} $BROKE is being processed!\n` +
          `It will arrive in your wallet soon.`
      );
    } catch (error) {
      console.error("Failed to notify user:", error);
    }

    // Notify admin with wallet details
    ctx.reply(
      `🏦 Withdrawal Details\n` +
        `━━━━━━━━━━━━━━━━━\n` +
        `User: @${user.username}\n` +
        `Amount: ${amount} $BROKE\n` +
        `Address: ${user.solanaAddress}\n\n` +
        `Please process this withdrawal manually.`
    );
  } catch (error) {
    console.error("Process withdrawal error:", error);
    ctx.reply("❌ Something went wrong! Please try again later.");
  }
});

// Add the rumble command
bot.command("brokerumble", async (ctx) => {
  try {
    // Check if there's already an active rumble
    if (activeRumble) {
      return ctx.reply("❌ A Broke Rumble is already in progress!");
    }

    // Initialize new rumble
    activeRumble = {
      players: [],
      started: false,
      messageId: null,
      startTime: Date.now(),
    };

    // Announce rumble and wait for players
    const message = await ctx.reply(
      `🏆 BROKE RUMBLE STARTING! 🏆\n` +
        `━━━━━━━━━━━━━━━━━\n\n` +
        `💰 Prize: 25000 broke points\n` +
        `⏳ Time to join: ${RUMBLE_DURATION} seconds\n\n` +
        `Reply with /join to enter!\n\n` +
        `Players (0): None`
    );

    activeRumble.messageId = message.message_id;

    // Start timer for joining period
    setTimeout(async () => {
      if (activeRumble?.players.length < MIN_PLAYERS) {
        ctx.reply("❌ Not enough players joined! Rumble cancelled.");
        activeRumble = null;
        return;
      }

      await startRumble(ctx);
    }, RUMBLE_DURATION * 1000);
  } catch (error) {
    console.error("Rumble error:", error);
    ctx.reply("❌ Failed to start Rumble!");
    activeRumble = null;
  }
});

// Add the join command
bot.command("join", async (ctx) => {
  try {
    if (!activeRumble || activeRumble.started) {
      return;
    }

    const player = {
      id: ctx.from.id.toString(),
      username: ctx.from.username || ctx.from.first_name,
    };

    // Check if player already joined
    if (activeRumble.players.some((p) => p.id === player.id)) {
      return;
    }

    // Add player and show join message
    activeRumble.players.push(player);
    await ctx.reply(getRandomMessage("join", { username: player.username }));

    // Update announcement message
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      activeRumble.messageId,
      null,
      `🏆 BROKE RUMBLE STARTING! 🏆\n` +
        `━━━━━━━━━━━━━━━━━\n\n` +
        `💰 Prize: 25000 broke points\n` +
        `⏳ Time to join: ${RUMBLE_DURATION} seconds\n\n` +
        `Reply with /join@brokiesbrokebot to enter!\n\n` +
        `Players (${activeRumble.players.length}): \n` +
        activeRumble.players.map((p) => `• @${p.username}`).join("\n")
    );
  } catch (error) {
    console.error("Join error:", error);
  }
});

// Message categories for the rumble
const rumbleMessages = {
  join: [
    "🎮 @{username} joins with a bag full of $BROKE!",
    "💸 @{username} appears, ready to stack more $BROKE!",
    "🎯 @{username} enters the arena of financial glory!",
    "🚀 @{username} apes in, sensing the next $BROKE pump!",
    "💰 @{username} joins with diamond hands and a $BROKE mindset!",
  ],

  attack: [
    "💸 @{attacker} dumps their SafeElonMoonDoge on @{target}! -{damage} HP!",
    "📉 @{attacker} shows @{target} their competitor's floor price! -{damage} HP!",
    "🏦 @{attacker} reveals @{target}'s non-$BROKE trading history! -{damage} HP!",
    "💰 @{attacker} makes @{target} FOMO into a non-$BROKE token! -{damage} HP!",
    "🔥 @{attacker} exposes @{target}'s paper hands on Reddit! -{damage} HP!",
    "🚀 @{attacker} tricks @{target} into shorting $BROKE! -{damage} HP!",
    "💀 @{attacker} makes @{target} trade against the trend! -{damage} HP!",
    "🎰 @{attacker} gives @{target} anti-$BROKE advice! -{damage} HP!",
    "🎯 @{attacker} shows @{target} their NFT collection! -{damage} HP!",
    "🌪️ @{attacker} liquidates @{target}'s leveraged position! -{damage} HP!",
    "🎪 @{attacker} makes @{target} buy high and sell low! -{damage} HP!",
    "🔮 @{attacker} gives @{target} financial advice from TikTok! -{damage} HP!",
    "💩 @{attacker} rugs @{target}'s favorite project! -{damage} HP!",
    "🎭 @{attacker} makes @{target} FOMO into a dead coin! -{damage} HP!",
    "🌋 @{attacker} shows @{target} their portfolio performance! -{damage} HP!",
    "🎪 @{attacker} makes @{target} trade with emotion! -{damage} HP!",
    "🎯 @{attacker} convinces @{target} to sell at the bottom! -{damage} HP!",
    "🔥 @{attacker} shows @{target} their unrealized losses! -{damage} HP!",
  ],

  special: [
    "🌟 @{username} discovers their old $BROKE stash... +{heal} HP from staking rewards!",
    "🎲 @{username} flips other tokens for more $BROKE... +{heal} HP from profits!",
    "💫 @{username} finds extra $BROKE in their wallet... +{heal} HP restored!",
    "🎭 @{username} gets a surprise $BROKE airdrop... +{heal} HP bonus!",
    "🌈 @{username} buys the perfect $BROKE dip... +{heal} HP gained!",
    "🎪 @{username} finds a lucky $BROKE penny... +{heal} HP from good fortune!",
    "🌠 @{username} gets financial advice from a fortune cookie... +{heal} HP restored!",
    "🎭 @{username} discovers $BROKE under their mattress... +{heal} HP found!",
    "🎨 @{username} sells their child's crayon art as an NFT for $BROKE... +{heal} HP earned!",
    "🎲 @{username} wins $BROKE in a game of rock, paper, scissors... +{heal} HP gained!",
    "🌟 @{username} finds $BROKE in their other pants... +{heal} HP recovered!",
    "🎪 @{username} sells their rare Pepe collection for $BROKE... +{heal} HP restored!",
    "🎭 @{username} discovers their grandma was stacking $BROKE... +{heal} HP inherited!",
    "🌈 @{username} finds $BROKE in their old crypto wallet... +{heal} HP remembered!",
    "🎲 @{username} gets tipped $BROKE by mistake... +{heal} HP gifted!",
    "🎨 @{username} trades their lunch money for $BROKE... +{heal} HP sacrificed!",
    "🎪 @{username} mines $BROKE with their toaster... +{heal} HP generated!",
    "🌟 @{username} gets $BROKE from their tooth fairy... +{heal} HP blessed!",
    "🎭 @{username} finds $BROKE in their spam folder... +{heal} HP recovered!",
    "🎲 @{username} gets $BROKE from their pet hamster's trading account... +{heal} HP gained!",
  ],

  elimination: [
    "💥 @{username} sold their $BROKE too early! Eliminated!",
    "🔥 @{username} followed non-$BROKE signals! Game over!",
    "💀 @{username} tried trading against $BROKE! Eliminated!",
    "📉 @{username} didn't buy enough $BROKE! Rekt!",
    "🚫 @{username} chose the wrong token over $BROKE! Gone!",
    "💸 @{username} didn't believe in $BROKE! Account zeroed!",
    "🎰 @{username} traded their $BROKE for a scam! Eliminated!",
    "🎭 @{username} paper handed their $BROKE bag! Eliminated!",
    "🌪️ @{username} got liquidated on 100x leverage! Destroyed!",
    "🎪 @{username} tried to short $BROKE! Rest in pieces!",
    "🔮 @{username} listened to their cousin's crypto advice! Obliterated!",
    "💩 @{username} bought ICP at $700! Total destruction!",
    "🎭 @{username} forgot their seed phrase! Account gone!",
    "🌋 @{username} sent $BROKE to the wrong address! Eliminated!",
    "🎪 @{username} tried day trading $BROKE! Account nuked!",
    "🎯 @{username} FOMOed at the top! Complete wipeout!",
    "🔥 @{username} stored their $BROKE on FTX! SBF'd!",
    "🎲 @{username} tried to time the $BROKE market! Rekt!",
    "🌟 @{username} bought $LUNA 2.0! Do Kwon'd!",
    "🎭 @{username} kept their $BROKE on a hot wallet! Hacked!",
    "🎪 @{username} traded $BROKE for DOGE! Much loss!",
    "🌈 @{username} tried to create $BROKE fork! Failed fork!",
    "🎲 @{username} forgot to take profits! Portfolio zeroed!",
    "🎨 @{username} traded with their rent money! Homeless!",
    "🎭 @{username} tried to compete with $BROKE! Eliminated!",
    "🌟 @{username} stored keys on Discord! Scammed!",
    "🎪 @{username} bought BitConnect! Carlos Matos'd!",
  ],

  finalShowdown: [
    "⚡ FINAL SHOWDOWN! @{player1} vs @{player2} - Battle of the $BROKE Kings!",
    "🔥 Two $BROKE warriors remain! @{player1} faces @{player2} in epic combat!",
    "💫 @{player1} and @{player2} prepare for the ultimate $BROKE battle!",
    "⚔️ The final $BROKE showdown: @{player1} vs @{player2}!",
    "🎭 Only one can be the $BROKE champion! @{player1} vs @{player2}!",
  ],

  winner: [
    "👑 @{winner} becomes the Ultimate $BROKE Champion!",
    "🏆 @{winner} masters the art of $BROKE trading!",
    "💰 @{winner} turns their $BROKE into more $BROKE!",
    "🌟 @{winner} proves they're the greatest $BROKE holder!",
    "🎉 @{winner} emerges as the $BROKE victor!",
    "🚀 @{winner} diamond hands their $BROKE to glory!",
    "💎 @{winner} becomes a $BROKE legend!",
  ],
};

// Helper function to get random message and replace placeholders
function getRandomMessage(category, replacements = {}) {
  const messages = rumbleMessages[category];
  let message = messages[Math.floor(Math.random() * messages.length)];

  // Replace all placeholders in the message
  Object.entries(replacements).forEach(([key, value]) => {
    message = message.replace(`{${key}}`, value);
  });

  return message;
}

// Helper function to start the rumble
async function startRumble(ctx) {
  try {
    activeRumble.started = true;
    let players = activeRumble.players.map((p) => ({
      ...p,
      hp: 100, // Each player starts with 100 HP
    }));

    await ctx.reply(
      `🎮 BROKE RUMBLE HAS BEGUN! 🎮\n` +
        `━━━━━━━━━━━━━━━━━\n\n` +
        `💀 ${players.length} $BROKE warriors enter the arena!\n` +
        `🛑 Only one will become the $BROKE champion!\n\n` +
        players.map((p) => `• @${p.username} (100 HP)`).join("\n")
    );

    // Battle loop
    while (players.length > 1) {
      // Increased delay between actions to 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 20% chance for special healing event
      if (Math.random() < 0.2) {
        const luckyPlayer = players[Math.floor(Math.random() * players.length)];
        const healAmount = Math.floor(Math.random() * 41) + 20; // Heal 20-60 HP
        luckyPlayer.hp = Math.min(100, luckyPlayer.hp + healAmount); // Cap at 100 HP

        await ctx.reply(
          getRandomMessage("special", {
            username: luckyPlayer.username,
            heal: healAmount,
          })
        );

        await ctx.reply(
          `💚 @${luckyPlayer.username} now has ${luckyPlayer.hp} HP!`
        );
        continue; // Skip attack this round
      }

      // Pick attacker and target
      const attacker = players[Math.floor(Math.random() * players.length)];
      const possibleTargets = players.filter(
        (p) => p.username !== attacker.username
      );
      const target =
        possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

      // Increased damage between 30-100 HP
      const damage = Math.floor(Math.random() * 71) + 30;
      target.hp -= damage;

      // Attack message
      await ctx.reply(
        getRandomMessage("attack", {
          attacker: attacker.username,
          target: target.username,
          damage: damage,
        }) + `\n💔 @${target.username} has ${Math.max(target.hp, 0)} HP left!`
      );

      // Check for elimination
      if (target.hp <= 0) {
        await ctx.reply(
          getRandomMessage("elimination", {
            username: target.username,
          })
        );
        players = players.filter((p) => p.username !== target.username);

        // Final showdown message when 2 players remain
        if (players.length === 2) {
          await ctx.reply(
            getRandomMessage("finalShowdown", {
              player1: players[0].username,
              player2: players[1].username,
            })
          );
        }
      }
    }

    // Announce winner
    const winner = players[0];

    // Fetch full user data for the winner
    const winnerData = await prisma.user.findUnique({
      where: { tgId: winner.id },
    });

    if (!winnerData) {
      throw new Error("Winner data not found");
    }

    const previousBalance = winnerData.leaderboardPoints;

    // Update points
    await prisma.user.update({
      where: { tgId: winner.id },
      data: {
        leaderboardPoints: {
          increment: 25000,
        },
      },
    });

    await ctx.reply(
      `🎉 BROKE RUMBLE WINNER! 🎉\n` +
        `━━━━━━━━━━━━━━━━━\n\n` +
        `${getRandomMessage("winner", { winner: winner.username })}\n` +
        `Prize: 25000 broke points 💰`
    );

    // Log activity with correct balance
    await logActivity(winnerData.id, "rumble", "won", 25000, previousBalance, {
      totalPlayers: activeRumble.players.length,
      participants: activeRumble.players.map((p) => ({
        username: p.username,
        id: p.id,
      })),
      timestamp: new Date(),
      gameLength: Date.now() - (activeRumble.startTime || Date.now()),
      previousBalance,
    });

    // Clear active rumble
    activeRumble = null;
  } catch (error) {
    console.error("Rumble error:", error);
    ctx.reply("❌ The market crashed! Something went wrong during the Rumble!");
    activeRumble = null;
  }
}

// Add this middleware after bot initialization but before command handlers
bot.use(async (ctx, next) => {
  // Skip check for /start command
  if (ctx.message?.text?.startsWith("/start")) {
    return next();
  }

  try {
    const tgId = ctx.from?.id?.toString();
    if (!tgId) {
      return ctx.reply("❌ Invalid request");
    }

    const user = await prisma.user.findUnique({
      where: { tgId: tgId },
    });

    if (!user) {
      return ctx.reply(
        `❌ Please register first!\n\n` +
          `Use /start@brokiesbrokebot to:\n` +
          `• Create your account\n` +
          `• Start earning points\n` +
          `• Join the $BROKE community`
      );
    }

    return next();
  } catch (error) {
    console.error("Middleware error:", error);
    return ctx.reply("❌ Something went wrong. Please try again later.");
  }
});
