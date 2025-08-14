import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WhatsAppBot } from "./services/whatsapp-bot";
import { print } from "./utils/print";
import { insertBotStatsSchema, insertCommandSchema, insertPluginSchema } from "@shared/schema";
import { z } from "zod";

// Initialize WhatsApp Bot
const whatsappBot = new WhatsAppBot();

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Clear console and show banner first
  console.clear();
  print.banner();
  
  // Initialize the bot silently
  try {
    await whatsappBot.initialize();
  } catch (error) {
    print.error(`Error iniciando bot: ${error}`);
  }

  // Bot status and control endpoints
  app.get("/api/bot/status", async (req, res) => {
    try {
      const status = whatsappBot.getConnectionStatus();
      const stats = await storage.getTodayStats();
      const activeGroups = await storage.getActiveGroups();
      const activePlugins = await storage.getEnabledPlugins();

      res.json({
        ...status,
        stats,
        activeGroups: activeGroups.length,
        activePlugins: activePlugins.length,
        uptime: process.uptime(),
        version: "2.1.5",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get bot status" });
    }
  });

  app.post("/api/bot/restart", async (req, res) => {
    try {
      await whatsappBot.restart();
      res.json({ success: true, message: "Bot restart initiated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to restart bot" });
    }
  });

  // System info endpoint
  app.get("/api/system/info", async (req, res) => {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      res.json({
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        },
        uptime: {
          formatted: formatUptime(process.uptime())
        },
        version: "2.1.5"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get system info" });
    }
  });

  // Activity endpoint
  app.get("/api/activity", async (req, res) => {
    try {
      // Mock activity data for now - in real implementation would come from message logs
      const activity = [
        { user: "Usuario123", action: "usó comando /ytmp3", group: "MegaGroup" },
        { user: "JuanPérez", action: "usó comando /sticker", group: "Amigos" },
        { user: "MaríaG", action: "usó comando /ia", group: "Familia" },
        { user: "Carlos_99", action: "usó comando /weather", group: "Trabajo" },
        { user: "Ana_Silva", action: "usó comando /translate", group: "Universidad" },
      ];
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  // Commands endpoints
  app.get("/api/commands", async (req, res) => {
    try {
      const commands = await storage.getAllCommands();
      res.json(commands);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch commands" });
    }
  });

  app.get("/api/commands/popular", async (req, res) => {
    try {
      const commands = await storage.getAllCommands();
      const popular = commands
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 10);
      res.json(popular);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch popular commands" });
    }
  });

  app.post("/api/commands", async (req, res) => {
    try {
      const validatedData = insertCommandSchema.parse(req.body);
      const command = await storage.createCommand(validatedData);
      res.status(201).json(command);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid command data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create command" });
      }
    }
  });

  app.put("/api/commands/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const command = await storage.updateCommand(id, updates);
      
      if (!command) {
        return res.status(404).json({ error: "Command not found" });
      }
      
      res.json(command);
    } catch (error) {
      res.status(500).json({ error: "Failed to update command" });
    }
  });

  // Plugins endpoints
  app.get("/api/plugins", async (req, res) => {
    try {
      const plugins = await storage.getAllPlugins();
      res.json(plugins);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plugins" });
    }
  });

  app.post("/api/plugins", async (req, res) => {
    try {
      const validatedData = insertPluginSchema.parse(req.body);
      const plugin = await storage.createPlugin(validatedData);
      res.status(201).json(plugin);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid plugin data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create plugin" });
      }
    }
  });

  app.put("/api/plugins/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const plugin = await storage.updatePlugin(id, updates);
      
      if (!plugin) {
        return res.status(404).json({ error: "Plugin not found" });
      }
      
      res.json(plugin);
    } catch (error) {
      res.status(500).json({ error: "Failed to update plugin" });
    }
  });

  // Groups endpoints
  app.get("/api/groups", async (req, res) => {
    try {
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.get("/api/groups/active", async (req, res) => {
    try {
      const groups = await storage.getActiveGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active groups" });
    }
  });

  // Users endpoints
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Stats endpoints
  app.get("/api/stats/today", async (req, res) => {
    try {
      const stats = await storage.getTodayStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch today's stats" });
    }
  });

  app.get("/api/stats/range", async (req, res) => {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ error: "Start and end dates are required" });
      }
      
      const stats = await storage.getStatsRange(start as string, end as string);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats range" });
    }
  });

  // System info endpoints
  app.get("/api/system/info", async (req, res) => {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      res.json({
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        },
        uptime: {
          seconds: Math.floor(uptime),
          formatted: new Date(uptime * 1000).toISOString().substr(11, 8),
        },
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system info" });
    }
  });

  // Activity log endpoint
  app.get("/api/activity", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      
      // Get recent messages as activity
      const recentMessages = await storage.getAllUsers();
      const activity = recentMessages
        .sort((a, b) => (b.lastActive?.getTime() || 0) - (a.lastActive?.getTime() || 0))
        .slice(0, limit)
        .map(user => ({
          id: user.id,
          type: 'command',
          user: user.username || user.phoneNumber,
          action: 'Comando ejecutado',
          timestamp: user.lastActive,
          group: 'N/A',
        }));

      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
