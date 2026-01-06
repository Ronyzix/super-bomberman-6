# Super Bomberman 6 - TODO

## Core Engine
- [x] Sistema de grid de movimento 2D
- [x] Sistema de colocação de bombas
- [x] Sistema de explosões com alcance configurável
- [x] Física de colisão com paredes e blocos
- [x] Sistema de destruição de blocos destrutíveis
- [x] Game loop otimizado com requestAnimationFrame
- [x] Sistema de câmera e viewport

## Personagens e Controles
- [x] Personagem jogador com animações (idle, walk, death)
- [x] Sistema de controles por teclado (WASD/Arrows + Space)
- [x] Sistema de controles touch para mobile (joystick virtual + botão de bomba)
- [x] Detecção automática de dispositivo (mobile/desktop)
- [x] Sistema de vidas e respawn

## Power-ups (6 tipos)
- [x] Speed Up - aumenta velocidade de movimento
- [x] Bomb Up - aumenta quantidade de bombas simultâneas
- [x] Fire Up - aumenta alcance da explosão
- [x] Power Bomb - explosão atravessa blocos
- [x] Remote Bomb - detonação manual
- [x] Line Bomb - coloca bombas em linha

## Tipos de Bombas (4 tipos)
- [x] Bomba Normal - explosão padrão em cruz
- [x] Bomba Penetrante - atravessa blocos destrutíveis
- [x] Bomba Remota - detonada pelo jogador
- [x] Bomba em Linha - explode em linha reta

## Inimigos (8+ tipos)
- [x] Slime - movimento aleatório básico
- [x] Bat - movimento rápido em padrão
- [x] Ghost - atravessa paredes
- [x] Bomber - coloca bombas
- [x] Charger - corre em direção ao jogador
- [x] Teleporter - teleporta aleatoriamente
- [x] Shield - imune a explosões por tempo
- [x] Splitter - divide em dois ao morrer

## IA dos Inimigos
- [x] Pathfinding A* para navegação
- [x] Sistema de detecção de jogador
- [x] Comportamentos únicos por tipo
- [x] Evasão de explosões
- [x] Dificuldade progressiva (velocidade, agressividade)

## Boss Fights (5 bosses)
- [x] Boss 1: King Slime - fase de tutorial
- [x] Boss 2: Dark Knight - padrões de ataque em área
- [x] Boss 3: Fire Dragon - ataques de fogo em linha
- [x] Boss 4: Shadow Lord - clones e teleporte
- [x] Boss 5: Demon King - múltiplas fases e mecânicas combinadas
- [x] Sistema de fases de batalha para cada boss
- [x] Padrões de ataque complexos
- [x] Cutscenes narrativas antes/depois de cada boss

## Fases (25 níveis)
- [x] World 1: Green Gardens (4 fases + boss)
- [x] World 2: Crystal Caves (4 fases + boss)
- [x] World 3: Volcanic Fortress (4 fases + boss)
- [x] World 4: Shadow Realm (4 fases + boss)
- [x] World 5: Demon Castle (4 fases + boss final)
- [x] Designs únicos por mundo
- [x] Obstáculos temáticos
- [x] Duração progressiva das fases
- [x] Sistema de estrelas por performance

## História e Narrativa
- [x] Introdução com história do protagonista
- [x] Diálogos entre fases
- [x] Cutscenes para cada boss
- [x] Final épico com créditos
- [x] Sistema de texto com typewriter effect

## Multiplayer Online
- [x] WebSocket server para sincronização em tempo real
- [x] Sistema de salas (criar/entrar)
- [x] Lobby com chat
- [x] Matchmaking automático
- [x] Sincronização de estado do jogo
- [x] Suporte para 2-4 jogadores cooperativos
- [x] Sistema de reconexão
- [x] Indicadores de latência

## Sistema de Ranking e Estatísticas
- [x] Tabela de líderes global (single player)
- [x] Tabela de líderes cooperativo
- [x] Estatísticas detalhadas por jogador
  - [x] Total de kills
  - [x] Total de mortes
  - [x] Fases completadas
  - [x] Tempo total jogado
  - [x] Maior combo
- [x] Sistema de conquistas desbloqueáveis
- [x] Perfil do jogador com histórico

## Modo Infinito
- [x] Geração procedural de mapas via LLM
- [x] Layouts únicos a cada partida
- [x] Posicionamento inteligente de obstáculos
- [x] Spawn balanceado de inimigos
- [x] Sistema de ondas progressivas
- [x] Leaderboard específico para modo infinito

## Sistema de Replays
- [x] Gravação automática de partidas
- [x] Armazenamento em nuvem (S3)
- [x] Sistema de reprodução de replays
- [x] Compartilhamento de melhores momentos
- [x] Galeria de replays da comunidade
- [x] Filtros e busca de replays

## Interface e Visual
- [x] Design elegante e refinado
- [x] Menu principal com animações
- [x] HUD in-game (vidas, bombas, power-ups, tempo)
- [x] Tela de pause
- [x] Tela de game over
- [x] Tela de vitória
- [x] Responsividade total (mobile/desktop)
- [x] Transições suaves entre telas

## Áudio
- [x] Música de fundo por mundo
- [x] Efeitos sonoros (explosões, power-ups, morte)
- [x] Som de UI (botões, menus)
- [x] Controle de volume
- [x] Música especial para boss fights

## Otimização
- [x] Performance em dispositivos móveis
- [x] Lazy loading de assets
- [x] Compressão de sprites
- [x] Otimização de WebSocket
- [x] Cache de recursos

## Database Schema
- [x] Tabela de usuários (existente)
- [x] Tabela de progresso do jogador
- [x] Tabela de estatísticas
- [x] Tabela de conquistas
- [x] Tabela de replays
- [x] Tabela de salas multiplayer
- [x] Tabela de leaderboards
