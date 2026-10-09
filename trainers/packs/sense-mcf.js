// mcfunction (Minecraft Java), "makes sense": commands that would really run, sometimes a few that
// belong together (make a score, count it, react to it). Selectors, coordinates, items and numbers come
// from small valid lists. sentence() → one command or a small group, as a string.

const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
const num = (a, b) => String(a + Math.floor(Math.random() * (b - a + 1)));

const SEL = ['@s', '@a', '@p', '@e[type=minecraft:zombie]', '@a[distance=..10]', '@e[type=minecraft:item]', '@a[tag=player]'];
const PLAYER = ['@s', '@a', '@p', '@a[tag=player]'];
const ITEMS = ['diamond', 'apple', 'bread', 'iron_sword', 'torch', 'oak_log', 'golden_apple', 'arrow', 'bow', 'cake'];
const EFFECTS = ['speed', 'jump_boost', 'regeneration', 'night_vision', 'slowness', 'strength', 'water_breathing'];
const MOBS = ['zombie', 'cow', 'pig', 'creeper', 'skeleton', 'chicken', 'sheep'];
const BLOCKS = ['stone', 'glass', 'gold_block', 'oak_planks', 'diamond_block', 'grass_block', 'air'];
const OBJ = ['points', 'kills', 'timer', 'deaths', 'coins'];
// Each score name with the kind of counter that fits it.
const CRITERIA = { points: 'dummy', kills: 'playerKillCount', timer: 'dummy', deaths: 'deathCount', coins: 'dummy' };
const MSGS = ['Welcome!', 'Game over', 'Round 1', 'Go!', 'You win!', 'Get ready', 'Watch out!'];
const TAGS = ['player', 'boss', 'ready', 'winner'];

function command() {
  return pick([
    () => `give ${pick(PLAYER)} minecraft:${pick(ITEMS)} ${num(1, 64)}`,
    () => `effect give ${pick(PLAYER)} minecraft:${pick(EFFECTS)} ${num(5, 60)} ${num(0, 2)}`,
    () => `tp ${pick(PLAYER)} ~ ~${num(1, 10)} ~`,
    () => `tp ${pick(PLAYER)} ${num(-50, 50)} ${num(60, 100)} ${num(-50, 50)}`,
    () => `summon minecraft:${pick(MOBS)} ~ ~ ~`,
    () => `tellraw ${pick(PLAYER)} {"text":"${pick(MSGS)}"}`,
    () => `title ${pick(PLAYER)} title {"text":"${pick(MSGS)}"}`,
    () => `kill @e[type=minecraft:${pick(MOBS)}]`,
    () => `setblock ~ ~-1 ~ minecraft:${pick(BLOCKS)}`,
    () => `fill ~-2 ~-1 ~-2 ~2 ~-1 ~2 minecraft:${pick(BLOCKS)}`,
    () => `tag ${pick(PLAYER)} add ${pick(TAGS)}`,
    () => `scoreboard players add ${pick(PLAYER)} ${pick(OBJ)} ${num(1, 10)}`,
    () => `scoreboard players set ${pick(PLAYER)} ${pick(OBJ)} 0`,
    () => `playsound minecraft:entity.experience_orb.pickup master ${pick(PLAYER)}`,
    () => `time set ${pick(['day', 'night', 'noon'])}`,
    () => `weather ${pick(['clear', 'rain', 'thunder'])}`,
    () => `gamemode ${pick(['creative', 'survival', 'adventure'])} ${pick(PLAYER)}`,
    () => `execute as ${pick(SEL)} at @s run ${pick([`tp @s ~ ~${num(1, 5)} ~`, `summon minecraft:${pick(MOBS)} ~ ~ ~`, `setblock ~ ~-1 ~ minecraft:${pick(BLOCKS)}`, 'kill @s'])}`,
  ])();
}

const GROUPS = [
  () => { const o = pick(OBJ); return [`scoreboard objectives add ${o} ${CRITERIA[o]}`, `scoreboard players add @a ${o} 1`, `execute as @a if score @s ${o} matches ${num(5, 20)}.. run tellraw @s {"text":"${pick(MSGS)}"}`]; },
  () => ['scoreboard objectives add timer dummy', 'scoreboard players add @a timer 1', 'execute as @a if score @s timer matches 200.. run title @s title {"text":"Time\'s up!"}'],
  () => [`execute as @a at @s if block ~ ~-1 ~ minecraft:${pick(['gold_block', 'slime_block', 'diamond_block'])} run effect give @s minecraft:jump_boost 1 ${num(2, 5)}`],
  () => { const t = pick(TAGS); return [`tag @p add ${t}`, `tp @a[tag=${t}] 0 ${num(64, 80)} 0`]; },
  () => [`summon minecraft:${pick(MOBS)} ~ ~ ~ {NoAI:1b}`, `tellraw @a {"text":"${pick(MSGS)}"}`],
  () => [`execute as @a[scores={deaths=1..}] run tellraw @s {"text":"Try again!"}`, 'scoreboard players set @a deaths 0'],
];

export function sentence() {
  return chance(0.6) ? command() : pick(GROUPS)().join(' ');
}
