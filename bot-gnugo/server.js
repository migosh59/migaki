const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

/* On stocke le processus globalement */
let gnugo = null;

/* Fonction pour tuer et relancer GNU Go avec les bons réglages à chaque partie */
function demarrerGnuGo(level = 10, rules = 'japanese') {
  if (gnugo) {
    gnugo.stdout.removeAllListeners('data');
    gnugo.kill();
  }

  const args = ['--mode', 'gtp', '--level', level.toString()];

  if (rules === 'chinese') {
    args.push('--chinese-rules');
  } else {
    args.push('--japanese-rules');
  }

  gnugo = spawn('/usr/games/gnugo', args);
}

/* Premier lancement par défaut au démarrage du NAS */
demarrerGnuGo();

function envoyerCommandeGTP(commande) {
  return new Promise((resolve) => {
    if (!gnugo || gnugo.killed) resolve('');
    let reponse = '';
    const onData = (data) => {
      reponse += data.toString();
      if (reponse.endsWith('\n\n')) {
        gnugo.stdout.removeListener('data', onData);
        resolve(reponse.trim());
      }
    };
    gnugo.stdout.on('data', onData);
    gnugo.stdin.write(commande + '\n');
  });
}

/* --- ROUTES API --- */

app.post('/api/reset', async (req, res) => {
  const handicap = parseInt(req.body.handicap) || 0;
  const komi = parseFloat(req.body.komi) || 6.5;
  const size = parseInt(req.body.size) || 19;
  /* --- RÉCUPÉRATION DES NOUVEAUX PARAMÈTRES --- */
  const rules = req.body.rules || 'japanese';
  const level = parseInt(req.body.level) || 10;

  /* On redémarre le moteur à neuf pour être 100% sûr qu'il a pris les bons arguments ! */
  demarrerGnuGo(level, rules);

  /* 1. On nettoie le plateau ET on applique la taille */
  await envoyerCommandeGTP(`boardsize ${size}`);
  await envoyerCommandeGTP('clear_board');

  /* 2. On applique le Komi */
  await envoyerCommandeGTP(`komi ${komi}`);

  /* 3. On applique le Handicap si nécessaire */
  let pierresHandicap = [];
  if (handicap >= 2 && handicap <= 9) {
    const rep = await envoyerCommandeGTP(`fixed_handicap ${handicap}`);
    const points = rep.replace('=', '').trim().split(/\s+/);
    if (points.length > 0 && points[0] !== '') {
      pierresHandicap = points;
    }
  }

  res.json({ status: 'ok', handicapStones: pierresHandicap });
});

app.post('/api/play', async (req, res) => {
  const { couleurJoueur, coupJoueur } = req.body;

  if (coupJoueur !== 'pass') {
    await envoyerCommandeGTP(`play ${couleurJoueur} ${coupJoueur}`);
  }

  const couleurBot = couleurJoueur === 'B' ? 'W' : 'B';
  const reponseBot = await envoyerCommandeGTP(`genmove ${couleurBot}`);
  const coupBot = reponseBot.replace('=', '').trim();

  res.json({ coup: coupBot });
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Serveur GNU Go prêt et en écoute sur le port 3000 !');
});

/* --- NOUVELLE ROUTE : CALCUL DU SCORE ET CAPTURES --- */
app.post('/api/score', async (req, res) => {
  /* 1. Score final (ex: B+10.5) */
  const score = await envoyerCommandeGTP('final_score');

  /* 2. Pierres capturées par Noir (prisonniers blancs) */
  const capB = await envoyerCommandeGTP('captures black');

  /* 3. Pierres capturées par Blanc (prisonniers noirs) */
  const capW = await envoyerCommandeGTP('captures white');

  res.json({
    score: score.replace('=', '').trim(),
    capturesBlack: capB.replace('=', '').trim(),
    capturesWhite: capW.replace('=', '').trim(),
  });
});
