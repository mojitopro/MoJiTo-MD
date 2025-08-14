// Banner simple y funcional para Termux
export function showBanner(): void {
  const banner = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ███╗   ███╗  ██████╗       ██╗ ██╗ ████████╗  ██████╗ 
        ████╗ ████║ ██╔═══██╗      ██║ ██║ ╚══██╔══╝ ██╔═══██╗
        ██╔████╔██║ ██║   ██║      ██║ ██║    ██║    ██║   ██║
        ██║╚██╔╝██║ ██║   ██║ ██   ██║ ██║    ██║    ██║   ██║
        ██║ ╚═╝ ██║ ╚██████╔╝ ╚█████╔╝ ██║    ██║    ╚██████╔╝
        ╚═╝     ╚═╝  ╚═════╝   ╚════╝  ╚═╝    ╚═╝     ╚═════╝ 
                         whatsapp bot md
🔮 Bot creado por Brian Martins
💻 Terminal operativa - Bot ejecutándose...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  console.log(`\x1b[36m${banner}\x1b[0m`);
}

export function logInfo(message: string): void {
  console.log(`\x1b[36m🔧 ${message}\x1b[0m`);
}

export function logSuccess(message: string): void {
  console.log(`\x1b[32m✅ ${message}\x1b[0m`);
}

export function logError(message: string): void {
  console.log(`\x1b[31m❌ ${message}\x1b[0m`);
}

export function logConnection(): void {
  console.log(`\x1b[32m▣─────────────────────────────···\x1b[0m`);
  console.log(`\x1b[32m│\x1b[0m`);
  console.log(`\x1b[32m│❧ ✅ Bot conectado exitosamente a WhatsApp ✅\x1b[0m`);
  console.log(`\x1b[32m│\x1b[0m`);
  console.log(`\x1b[32m▣─────────────────────────────···\x1b[0m`);
}