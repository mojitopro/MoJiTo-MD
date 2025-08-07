
import cluster from 'cluster';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import cfonts from 'cfonts';
import { createInterface } from 'readline';
import yargs from 'yargs';
import chalk from 'chalk';
import gradient from 'gradient-string';
import ora from 'ora';
import { setTimeout as wait } from 'timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rl = createInterface(process.stdin, process.stdout);

if (cluster.isPrimary) {
  (async () => {
    // Animación tipo consola tecnológica
    const boot = ora(chalk.cyanBright('Inicializando sistema neural...')).start();
    await wait(800);
    boot.text = chalk.magenta('Cargando módulos de defensa...');
    await wait(800);
    boot.text = chalk.blueBright('Conectando al núcleo principal...');
    await wait(800);
    boot.text = chalk.green('Estableciendo conexión con el bot...');
    await wait(1000);
    boot.succeed(chalk.greenBright('✅ Entorno listo'));

    // Separador visual superior
    console.log(gradient.pastel('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

    // Tu banner original, estilo marcador/cartel
    cfonts.say('© MoJiTo', {
      font: 'block',
      align: 'center',
      colors: ['red', 'magenta'],
      background: 'transparent',
      letterSpacing: 1,
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      lineHeight: 1,
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      space: true,
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      maxLength: '0'
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    });

    // Subtítulo técnico
    cfonts.say('WhatsApp Bot MD', {
      font: 'console',
      align: 'center',
      colors: ['cyan'],
      space: false
    });


    console.log(chalk.magenta.bold('\n🔮 Bot creado por Brian Martins'));
    console.log(gradient.atlas('💻 Terminal operativa - Bot ejecutándose...\n'));
    console.log(gradient.pastel('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    // Inicia el worker
    let worker = cluster.fork();

    worker.on('message', (data) => {
      console.log(chalk.blueBright('[DATA]'), data);
      switch (data) {
        case 'reset':
          console.log(chalk.yellow('🔄 Reiniciando worker...'));
          worker.process.kill();
          worker = cluster.fork();
          break;
        case 'uptime':
          worker.send(process.uptime());
          break;
        default:
          console.log(chalk.redBright('⚠ Entrada desconocida del worker →'), data);
      }
    });
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    worker.on('exit', (code, signal) => {
      console.error(chalk.red(`❌ Worker finalizado (código ${code}, señal ${signal})`));
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      console.log(chalk.yellow('♻ Reiniciando automáticamente...'));
      worker = cluster.fork();
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    });

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    const opts = yargs(process.argv.slice(2)).exitProcess(false).parse();

    if (!opts['test']) {
      if (!rl.listenerCount()) {
        rl.on('line', line => {
          if (worker.isConnected()) {
            worker.send(line.trim());
          }
        });
      }
    }
  })();
} else {
  import('./main.js');
}

