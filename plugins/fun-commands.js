/**
 * Ultra-fast fun commands with modern youth style
 */

export async function handler(m, { conn, usedPrefix, command, args }) {
  const startTime = process.hrtime.bigint();

  switch (command) {
    case 'meme': {
      const memes = [
        '😂 Cuando tu crush te deja en visto:\n"Modo fantasma activado 👻"',
        '🤡 Yo: "No voy a procrastinar hoy"\nTambién yo: *viendo memes a las 3am*',
        '💔 Relación status:\n"Es complicado con mi cama 🛏️"',
        '🧠 Mi cerebro a las 3am:\n"¿Los pingüinos tienen rodillas?" 🐧',
        '☕ Café antes vs después:\n"Zombie ➡️ Superhéroe"',
        '📱 Batería al 1%:\n"Es mi momento de brillar" ✨',
        '🎮 Mamá: "Pausa el juego"\nYo: "¡NO SE PUEDE PAUSAR UN ONLINE!"',
        '🍕 Pizza vs Ensalada:\nPizza: 1000 - Ensalada: 0',
        '💤 Lunes por la mañana:\n"404 Motivación no encontrada"',
        '🎵 Escuchando la misma canción 100 veces:\n"Aún no me aburre 🔄"'
      ];
      
      const randomMeme = memes[Math.floor(Math.random() * memes.length)];
      const responseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      await conn.sendMessage(m.chat, {
        text: `🎭 *MEME ULTRA FRESH* 🎭\n\n${randomMeme}\n\n⚡ Generado en ${responseTime.toFixed(1)}ms\n🔥 Nivel de comedia: ÉPICO`
      });
      break;
    }

    case 'dado':
    case 'dice': {
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const total = dice1 + dice2;
      
      const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      const result = total === 12 ? 'JACKPOT! 🎰' : 
                    total >= 10 ? 'GENIAL! 🔥' : 
                    total >= 7 ? 'NO ESTÁ MAL 👌' : 
                    total <= 4 ? 'F por ti 💀' : 'PROMEDIO 📊';
      
      const responseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      await conn.sendMessage(m.chat, {
        text: `🎲 *DADOS ULTRA RÁPIDOS* 🎲\n\n${diceEmojis[dice1-1]} ${diceEmojis[dice2-1]}\n\n📊 Total: ${total}\n🎯 Resultado: ${result}\n⚡ Lanzado en ${responseTime.toFixed(1)}ms\n\n${total === 7 ? '🍀 ¡Número de la suerte!' : total === 12 ? '💎 ¡DOBLE SEIS ÉPICO!' : '🎮 ¡Sigue jugando!'}`
      });
      break;
    }

    case 'coin':
    case 'moneda': {
      const result = Math.random() < 0.5 ? 'CARA' : 'CRUZ';
      const emoji = result === 'CARA' ? '👨‍💼' : '🦅';
      const message = result === 'CARA' ? 
        '¡Cara ganó! La suerte está de tu lado 🍀' : 
        '¡Cruz apareció! El destino ha hablado 🔮';
      
      const responseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      await conn.sendMessage(m.chat, {
        text: `🪙 *CARA O CRUZ ULTRA* 🪙\n\n${emoji} *${result}* ${emoji}\n\n🎯 ${message}\n⚡ Lanzado en ${responseTime.toFixed(1)}ms\n\n🔥 ¿Otra ronda? ¡Dale de nuevo!`
      });
      break;
    }

    case 'random':
    case 'numero': {
      const max = parseInt(args[0]) || 100;
      const min = parseInt(args[1]) || 1;
      const number = Math.floor(Math.random() * (max - min + 1)) + min;
      
      const special = number === 69 ? ' ¡Nice! 😏' :
                     number === 420 ? ' ¡Blazeit! 🔥' :
                     number === 777 ? ' ¡JACKPOT! 🎰' :
                     number === 666 ? ' Diabólico... 😈' :
                     number === max ? ' ¡MÁXIMO! 💥' :
                     number === min ? ' ¡MÍNIMO! ⬇️' : '';
      
      const responseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      await conn.sendMessage(m.chat, {
        text: `🎰 *NÚMERO ULTRA RANDOM* 🎰\n\n🔢 Resultado: *${number}*${special}\n📊 Rango: ${min} - ${max}\n⚡ Generado en ${responseTime.toFixed(1)}ms\n\n🎯 Uso: ${usedPrefix}random [máximo] [mínimo]`
      });
      break;
    }

    case 'broma':
    case 'joke': {
      const jokes = [
        '¿Por qué los pájaros vuelan hacia el sur en invierno?\n¡Porque es muy lejos para caminar! 🦅',
        '¿Cuál es el colmo de un electricista?\nQue su mujer se llame Luz y le dé corriente 🔌',
        'Doctor: "Tiene usted una tensión muy alta"\nPaciente: "Normal, vengo de una final de fútbol" ⚽',
        '¿Qué le dice un semáforo a otro?\n"No me mires que me pongo colorado" 🚦',
        '¿Por qué los buzos se tiran hacia atrás?\nPorque si se tiran hacia adelante, caen al bote! 🤿',
        'Mamá, mamá, en el colegio me dicen mentiroso\n"Cállate hijo, si tú no vas al colegio" 🏫',
        '¿Cuál es el animal más antiguo?\nLa cebra, porque está en blanco y negro 🦓',
        '¿Qué le dice un taco a otro taco?\n"¡Qué onda, amigo!" 🌮',
        'Era tan malo el hotel que hasta las cucarachas\ntraían tienda de campaña 🏕️',
        '¿Cómo se llama el campeón de buceo japonés?\nToko Ondo 🏊‍♂️'
      ];
      
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
      const responseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      await conn.sendMessage(m.chat, {
        text: `😂 *BROMA ULTRA FRESH* 😂\n\n${randomJoke}\n\n⚡ Cargada en ${responseTime.toFixed(1)}ms\n🎭 Nivel de comedia: DAD JOKES\n\n🔄 ¿Otra broma? ¡Dale de nuevo!`
      });
      break;
    }

    case '8ball':
    case 'bola8': {
      if (!args.join(' ').trim()) {
        return conn.sendMessage(m.chat, {
          text: `🎱 *BOLA 8 MÁGICA* 🎱\n\n❓ Hazme una pregunta y te daré una respuesta épica\n\n💫 Uso: ${usedPrefix}8ball ¿pregunta?`
        });
      }

      const answers = [
        'Definitivamente sí 💯',
        'Sin duda alguna 🔥',
        'Puedes contar con ello ✅',
        'Sí, definitivamente 👍',
        'Es muy probable 📈',
        'Las perspectivas son buenas 🌟',
        'Sí 💚',
        'Todo indica que sí ⬆️',
        'Respuesta confusa, intenta de nuevo 🔄',
        'Pregunta de nuevo más tarde 🕐',
        'Mejor no te lo digo ahora 🤫',
        'No puedo predecirlo ahora 🔮',
        'Concéntrate y pregunta de nuevo 🎯',
        'No cuentes con ello ❌',
        'Mi respuesta es no 👎',
        'Mis fuentes dicen que no 📰',
        'Las perspectivas no son buenas 📉',
        'Muy dudoso 😐'
      ];
      
      const answer = answers[Math.floor(Math.random() * answers.length)];
      const question = args.join(' ');
      const responseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      await conn.sendMessage(m.chat, {
        text: `🎱 *BOLA 8 ULTRA MÁGICA* 🎱\n\n❓ *Pregunta:*\n${question}\n\n🔮 *Respuesta de la bola:*\n${answer}\n\n⚡ Consultado en ${responseTime.toFixed(1)}ms\n✨ El destino ha hablado...`
      });
      break;
    }
  }
}

export const help = ['meme', 'dado', 'dice', 'coin', 'moneda', 'random', 'numero', 'broma', 'joke', '8ball', 'bola8'];
export const tags = ['fun', 'diversión'];
export const command = /^(meme|dado|dice|coin|moneda|random|numero|broma|joke|8ball|bola8)$/i;