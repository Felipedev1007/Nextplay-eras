export const ERAS = [
  {
    id: 'pong',
    year: '1972',
    title: 'Pong',
    subtitle: 'O Big Bang dos videogames',
    era: 'Era Arcade Inicial',
    color: 'green',
    accentClass: 'text-neon-green',
    bgGradient: 'from-black via-green-950/30 to-black',
    description: 'Lançado pela Atari, Pong foi um dos primeiros videogames comerciais de sucesso. Sua simplicidade — duas barras e uma bola — provou que jogos eletrônicos poderiam ser um fenômeno de massa.',
    tech: 'Hardware dedicado, gráficos vetoriais monocromáticos, som gerado por circuitos analógicos.',
    facts: [
      'Pong foi inspirado em "Tennis for Two" (1958), considerado um dos primeiros jogos eletrônicos.',
      'A primeira máquina de Pong quebrou em uma semana porque estava cheia de moedas.',
      'O som icônico do "blip" foi um acidente — Allan Alcorn improvisou com circuitos disponíveis.'
    ],
    next: 'invaders'
  },
  {
    id: 'invaders',
    year: '1978',
    title: 'Space Invaders',
    subtitle: 'A invasão que mudou tudo',
    era: 'Era Arcade Clássica',
    color: 'cyan',
    accentClass: 'text-neon-cyan',
    bgGradient: 'from-black via-cyan-950/30 to-black',
    description: 'Space Invaders popularizou o gênero shoot \'em up e introduziu o conceito de high score. A Taito criou uma febre tão grande no Japão que causou escassez nacional de moedas de 100 ienes.',
    tech: 'Microprocessador Intel 8080, sprites 2D pixelados, som digital de 3 canais.',
    facts: [
      'O jogo ficava mais rápido conforme você matava alienígenas — isso era um BUG, mas virou feature.',
      'Foi o primeiro jogo a permitir que o jogador salvasse iniciais ao lado da pontuação.',
      'O design dos invasores foi inspirado em criaturas marinhas — polvos, lulas e caranguejos.'
    ],
    next: 'pacman'
  },
  {
    id: 'pacman',
    year: '1980',
    title: 'Pac-Man',
    subtitle: 'Nasce a cultura gamer',
    era: 'Era dos Mascotes',
    color: 'yellow',
    accentClass: 'text-neon-yellow',
    bgGradient: 'from-black via-yellow-950/30 to-black',
    description: 'Toru Iwatani criou Pac-Man querendo um jogo que atraísse mulheres aos arcades. O resultado: o primeiro mascote dos videogames, merchandising bilionário e a prova de que jogos podiam contar histórias.',
    tech: 'Hardware Namco Pac-Man (Z80), sprites coloridos, IA com personalidades distintas para cada fantasma.',
    facts: [
      'Cada fantasma tem uma personalidade: Blinky persegue, Pinky embosca, Inky é imprevisível e Clyde é tímido.',
      'O design veio de uma pizza com uma fatia faltando — virou ícone cultural global.',
      'Existe um "kill screen" no nível 256 causado por um overflow de inteiro.'
    ],
    next: 'mario'
  },
  {
    id: 'mario',
    year: '1985',
    title: 'Super Mario Bros.',
    subtitle: 'O console doméstico domina',
    era: 'Era das Plataformas',
    color: 'pink',
    accentClass: 'text-neon-pink',
    bgGradient: 'from-black via-pink-950/30 to-black',
    description: 'Com o NES da Nintendo, jogos saíram dos arcades e invadiram salas de estar. Super Mario Bros. definiu o gênero plataforma, com level design impecável e o nascimento do mascote mais famoso do mundo.',
    tech: 'NES (CPU Ricoh 2A03), gráficos 8-bit com paleta de 54 cores, scroll lateral suave.',
    facts: [
      'As nuvens e os arbustos são exatamente o mesmo sprite — só mudam a cor.',
      'Mario foi originalmente chamado "Jumpman" e era carpinteiro, não encanador.',
      'O cartucho do jogo só tinha 40KB — menos que uma foto de celular hoje.'
    ],
    next: 'fps'
  },
  {
    id: 'fps',
    year: '1999',
    title: 'Counter-Strike',
    subtitle: 'A era do multiplayer online',
    era: 'Era LAN & eSports',
    color: 'purple',
    accentClass: 'text-neon-purple',
    bgGradient: 'from-black via-purple-950/30 to-black',
    description: 'Originalmente um mod de Half-Life criado por Minh Le e Jess Cliffe, Counter-Strike redefiniu o multiplayer competitivo. Lan houses dos anos 2000 e os primeiros eSports devem muito a esse marco.',
    tech: 'GoldSrc engine, modelos 3D com texturas, rede cliente-servidor, gráficos OpenGL/DirectX.',
    facts: [
      'CS começou como um mod gratuito feito por dois estudantes nas horas vagas.',
      'A bomba do mapa de_dust2 é, oficialmente, o objeto mais plantado da história dos jogos.',
      'O mapa "de_dust" é tão icônico que foi recriado em todas as versões da série até hoje.'
    ],
    next: 'modern'
  }
];

export const getEra = (id) => ERAS.find(e => e.id === id);
export const ERA_INDEX = (id) => ERAS.findIndex(e => e.id === id);