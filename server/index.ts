import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { elegantLogger } from "./utils/elegant-logger";

// Importaciones dinámicas para compatibilidad
let setupConsoleOverride: any = null;
let StartupBanner: any = null;
let TermuxDetector: any = null;

// Cargar módulos de compatibilidad
async function loadCompatibilityModules() {
  try {
    const consoleModule = await import("./utils/console-formatter");
    setupConsoleOverride = consoleModule.setupConsoleOverride;
  } catch (error) {
    console.log('Console formatter not available, using default console...');
    setupConsoleOverride = () => {};
  }

  try {
    const bannerModule = await import("./utils/startup-banner");
    StartupBanner = bannerModule.StartupBanner;
  } catch (error) {
    console.log('Startup banner not available, using fallback...');
    StartupBanner = { 
      showStartupSequence: () => Promise.resolve(),
      showServerRunning: (port: number) => console.log(`🌐 Dashboard: http://localhost:${port}`)
    };
  }

  try {
    const termuxModule = await import('./utils/termux-detector.js');
    TermuxDetector = termuxModule.default;
  } catch (error) {
    console.log('TermuxDetector not available, continuing...');
    TermuxDetector = { logEnvironmentInfo: () => {} };
  }

  try {
    // @ts-ignore - Optional termux compatibility module
    await import('../termux-compatibility.js');
  } catch (error) {
    // Silently continue if not available
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Solo loggear rutas importantes o con errores
      const isImportantRoute = !path.includes('/status') && !path.includes('/info') && !path.includes('/activity');
      const hasError = res.statusCode >= 400;
      
      if (isImportantRoute || hasError) {
        elegantLogger.logApiRequest(req.method, path, res.statusCode, duration);
      } else {
        // Para rutas de monitoreo, usar el sistema de throttling
        elegantLogger.logApiRequest(req.method, path, res.statusCode, duration);
      }
    }
  });

  next();
});

(async () => {
  // Cargar módulos de compatibilidad
  await loadCompatibilityModules();

  // Termux compatibility check
  if (process.env.PREFIX && process.env.PREFIX.includes('termux')) {
    console.log('🤖 Detectado entorno Termux - Aplicando optimizaciones...');

    // Set Termux-specific environment variables
    process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--max-old-space-size=512';

    // Log environment info for Termux
    if (TermuxDetector && TermuxDetector.logEnvironmentInfo) {
      TermuxDetector.logEnvironmentInfo();
    }
  }

  // Setup clean console output
  if (setupConsoleOverride && typeof setupConsoleOverride === 'function') {
    setupConsoleOverride();
  }

  // Mostrar banner de inicio elegante
  if (StartupBanner && StartupBanner.showStartupSequence) {
    await StartupBanner.showStartupSequence();
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    StartupBanner.showServerRunning(port);
  });
})();