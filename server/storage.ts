import { type User, type InsertUser, type Group, type InsertGroup, type Command, type InsertCommand, type Plugin, type InsertPlugin, type Message, type InsertMessage, type BotStats, type InsertBotStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Groups
  getGroup(id: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, updates: Partial<Group>): Promise<Group | undefined>;
  getAllGroups(): Promise<Group[]>;
  getActiveGroups(): Promise<Group[]>;

  // Commands
  getCommand(name: string): Promise<Command | undefined>;
  createCommand(command: InsertCommand): Promise<Command>;
  updateCommand(id: string, updates: Partial<Command>): Promise<Command | undefined>;
  getAllCommands(): Promise<Command[]>;
  getEnabledCommands(): Promise<Command[]>;
  getCommandsByCategory(category: string): Promise<Command[]>;
  incrementCommandUsage(name: string): Promise<void>;

  // Plugins
  getPlugin(name: string): Promise<Plugin | undefined>;
  createPlugin(plugin: InsertPlugin): Promise<Plugin>;
  updatePlugin(id: string, updates: Partial<Plugin>): Promise<Plugin | undefined>;
  getAllPlugins(): Promise<Plugin[]>;
  getEnabledPlugins(): Promise<Plugin[]>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByGroup(groupId: string, limit?: number): Promise<Message[]>;
  getMessagesByUser(fromNumber: string, limit?: number): Promise<Message[]>;

  // Stats
  getBotStats(date: string): Promise<BotStats | undefined>;
  createOrUpdateBotStats(stats: InsertBotStats): Promise<BotStats>;
  getTodayStats(): Promise<BotStats>;
  getStatsRange(startDate: string, endDate: string): Promise<BotStats[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private groups: Map<string, Group>;
  private commands: Map<string, Command>;
  private plugins: Map<string, Plugin>;
  private messages: Map<string, Message>;
  private botStats: Map<string, BotStats>;

  constructor() {
    this.users = new Map();
    this.groups = new Map();
    this.commands = new Map();
    this.plugins = new Map();
    this.messages = new Map();
    this.botStats = new Map();
    
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default commands
    const defaultCommands: InsertCommand[] = [
      { name: "ping", description: "Probar respuesta del bot", category: "utility", usage: "/ping", isEnabled: true, usageCount: 245 },
      { name: "menu", description: "Mostrar menú del bot", category: "utility", usage: "/menu", isEnabled: true, usageCount: 189 },
      { name: "help", description: "Ayuda del bot", category: "utility", usage: "/help", isEnabled: true, usageCount: 156 },
      { name: "info", description: "Información del bot", category: "utility", usage: "/info", isEnabled: true, usageCount: 134 },
      { name: "play", description: "Buscar y reproducir música de YouTube", category: "music", usage: "/play <nombre de canción>", isEnabled: true, usageCount: 198 },
      { name: "ytmp3", description: "Descargar audio de YouTube", category: "downloads", usage: "/ytmp3 <url>", isEnabled: true, usageCount: 127 },
      { name: "ytmp4", description: "Descargar video de YouTube", category: "downloads", usage: "/ytmp4 <url>", isEnabled: true, usageCount: 84 },
      { name: "sticker", description: "Crear stickers", category: "media", usage: "/sticker (responder a imagen)", isEnabled: true, usageCount: 94 },
      { name: "ia", description: "ChatGPT Integration", category: "ai", usage: "/ia <pregunta>", isEnabled: true, usageCount: 73 },
      { name: "translate", description: "Traducir texto", category: "utility", usage: "/translate <idioma> <texto>", isEnabled: true, usageCount: 56 },
      { name: "weather", description: "Consultar clima", category: "utility", usage: "/weather <ciudad>", isEnabled: true, usageCount: 42 },
      { name: "meme", description: "Generar memes", category: "entertainment", usage: "/meme", isEnabled: true, usageCount: 38 },
      { name: "trivia", description: "Juego de trivia", category: "games", usage: "/trivia", isEnabled: true, usageCount: 29 },
    ];

    defaultCommands.forEach(cmd => {
      const command: Command = { 
        id: randomUUID(), 
        ...cmd,
        isEnabled: cmd.isEnabled ?? true,
        usageCount: cmd.usageCount ?? 0,
        plugin: cmd.plugin ?? null
      };
      this.commands.set(command.name, command);
    });

    // Initialize default plugins
    const defaultPlugins: InsertPlugin[] = [
      { name: "youtube-downloader", description: "Plugin para descargar contenido de YouTube", version: "1.0.0", isEnabled: true, config: {} },
      { name: "sticker-maker", description: "Plugin para crear stickers", version: "1.2.0", isEnabled: true, config: {} },
      { name: "ai-chatgpt", description: "Plugin de integración con ChatGPT", version: "2.1.0", isEnabled: true, config: {} },
      { name: "anti-spam", description: "Plugin de moderación anti-spam", version: "1.5.0", isEnabled: true, config: {} },
      { name: "welcome-message", description: "Plugin de mensajes de bienvenida", version: "1.0.0", isEnabled: true, config: {} },
    ];

    defaultPlugins.forEach(plugin => {
      const pluginData: Plugin = { 
        id: randomUUID(), 
        ...plugin, 
        createdAt: new Date(),
        isEnabled: plugin.isEnabled ?? true,
        config: plugin.config ?? {}
      };
      this.plugins.set(plugin.name, pluginData);
    });

    // Initialize today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayStats: BotStats = {
      id: randomUUID(),
      date: today,
      messagesReceived: 1247,
      commandsExecuted: 382,
      activeGroups: 23,
      activeUsers: 156,
      downloadsCount: 89,
    };
    this.botStats.set(today, todayStats);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phoneNumber === phoneNumber);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id, 
      ...insertUser, 
      username: insertUser.username ?? null,
      level: insertUser.level || 1,
      experience: insertUser.experience || 0,
      commandsUsed: insertUser.commandsUsed || 0,
      isAdmin: insertUser.isAdmin || false,
      isBanned: insertUser.isBanned || false,
      lastActive: new Date(),
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Groups
  async getGroup(id: string): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const group: Group = { 
      ...insertGroup, 
      description: insertGroup.description ?? null,
      welcomeMessage: insertGroup.welcomeMessage ?? null,
      settings: insertGroup.settings ?? {},
      isActive: insertGroup.isActive !== undefined ? insertGroup.isActive : true,
      antiSpam: insertGroup.antiSpam || false,
      rules: insertGroup.rules || [],
      adminNumbers: insertGroup.adminNumbers || [],
      createdAt: new Date(),
    };
    this.groups.set(group.id, group);
    return group;
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group | undefined> {
    const group = this.groups.get(id);
    if (!group) return undefined;
    
    const updatedGroup = { ...group, ...updates };
    this.groups.set(id, updatedGroup);
    return updatedGroup;
  }

  async getAllGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }

  async getActiveGroups(): Promise<Group[]> {
    return Array.from(this.groups.values()).filter(group => group.isActive);
  }

  // Commands
  async getCommand(name: string): Promise<Command | undefined> {
    return this.commands.get(name);
  }

  async createCommand(insertCommand: InsertCommand): Promise<Command> {
    const id = randomUUID();
    const command: Command = { 
      id, 
      ...insertCommand,
      plugin: insertCommand.plugin ?? null,
      isEnabled: insertCommand.isEnabled !== undefined ? insertCommand.isEnabled : true,
      usageCount: insertCommand.usageCount || 0,
    };
    this.commands.set(command.name, command);
    return command;
  }

  async updateCommand(id: string, updates: Partial<Command>): Promise<Command | undefined> {
    const command = Array.from(this.commands.values()).find(cmd => cmd.id === id);
    if (!command) return undefined;
    
    const updatedCommand = { ...command, ...updates };
    this.commands.set(command.name, updatedCommand);
    return updatedCommand;
  }

  async getAllCommands(): Promise<Command[]> {
    return Array.from(this.commands.values());
  }

  async getEnabledCommands(): Promise<Command[]> {
    return Array.from(this.commands.values()).filter(cmd => cmd.isEnabled);
  }

  async getCommandsByCategory(category: string): Promise<Command[]> {
    return Array.from(this.commands.values()).filter(cmd => cmd.category === category);
  }

  async incrementCommandUsage(name: string): Promise<void> {
    const command = this.commands.get(name);
    if (command) {
      command.usageCount = (command.usageCount || 0) + 1;
      this.commands.set(name, command);
    }
  }

  // Plugins
  async getPlugin(name: string): Promise<Plugin | undefined> {
    return this.plugins.get(name);
  }

  async createPlugin(insertPlugin: InsertPlugin): Promise<Plugin> {
    const id = randomUUID();
    const plugin: Plugin = { 
      id, 
      ...insertPlugin,
      isEnabled: insertPlugin.isEnabled !== undefined ? insertPlugin.isEnabled : true,
      config: insertPlugin.config || {},
      createdAt: new Date(),
    };
    this.plugins.set(plugin.name, plugin);
    return plugin;
  }

  async updatePlugin(id: string, updates: Partial<Plugin>): Promise<Plugin | undefined> {
    const plugin = Array.from(this.plugins.values()).find(p => p.id === id);
    if (!plugin) return undefined;
    
    const updatedPlugin = { ...plugin, ...updates };
    this.plugins.set(plugin.name, updatedPlugin);
    return updatedPlugin;
  }

  async getAllPlugins(): Promise<Plugin[]> {
    return Array.from(this.plugins.values());
  }

  async getEnabledPlugins(): Promise<Plugin[]> {
    return Array.from(this.plugins.values()).filter(plugin => plugin.isEnabled);
  }

  // Messages
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
      id, 
      ...insertMessage,
      content: insertMessage.content ?? null,
      groupId: insertMessage.groupId ?? null,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByGroup(groupId: string, limit = 100): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.groupId === groupId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async getMessagesByUser(fromNumber: string, limit = 100): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.fromNumber === fromNumber)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  // Stats
  async getBotStats(date: string): Promise<BotStats | undefined> {
    return this.botStats.get(date);
  }

  async createOrUpdateBotStats(insertStats: InsertBotStats): Promise<BotStats> {
    const existing = this.botStats.get(insertStats.date);
    if (existing) {
      const updated = { ...existing, ...insertStats };
      this.botStats.set(insertStats.date, updated);
      return updated;
    }
    
    const id = randomUUID();
    const stats: BotStats = { 
      id, 
      ...insertStats,
      messagesReceived: insertStats.messagesReceived ?? 0,
      commandsExecuted: insertStats.commandsExecuted ?? 0,
      activeGroups: insertStats.activeGroups ?? 0,
      activeUsers: insertStats.activeUsers ?? 0,
      downloadsCount: insertStats.downloadsCount ?? 0
    };
    this.botStats.set(insertStats.date, stats);
    return stats;
  }

  async getTodayStats(): Promise<BotStats> {
    const today = new Date().toISOString().split('T')[0];
    let stats = this.botStats.get(today);
    
    if (!stats) {
      stats = await this.createOrUpdateBotStats({
        date: today,
        messagesReceived: 0,
        commandsExecuted: 0,
        activeGroups: 0,
        activeUsers: 0,
        downloadsCount: 0,
      });
    }
    
    return stats;
  }

  async getStatsRange(startDate: string, endDate: string): Promise<BotStats[]> {
    return Array.from(this.botStats.values())
      .filter(stats => stats.date >= startDate && stats.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const storage = new MemStorage();
