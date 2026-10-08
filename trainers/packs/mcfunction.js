// mcfunction (Minecraft Java commands): commands, selectors, coordinates and bits, each typed as one "word".
// Monkeytype has no pack for this one; written for this app.
export default {
  id: 'mcf',
  name: 'mcfunction',
  code: true,
  words: `execute as at positioned rotated facing anchored align in if unless run store result success
score entity block blocks data predicate function return schedule tag say tellraw title actionbar
give summon kill tp teleport effect clear enchant setblock fill clone particle playsound stopsound
scoreboard objectives players add remove set reset operation list display sidebar dummy
gamemode creative survival adventure spectator gamerule weather time day night difficulty
bossbar item replace loot spawn modify merge get storage with
@s @a @p @e @r @e[type=zombie] @a[distance=..10] @s[tag=player] @e[limit=1,sort=nearest]
@a[scores={timer=20..}] @e[type=item] matches 1.. ..10 0..5
~ ~1 ~-1 ~0.5 ^ ^1 ^-1 0 1 64 100 -1
minecraft:stone minecraft:diamond minecraft:speed minecraft:zombie minecraft:air
#minecraft:logs #tick #load {Tags:["boss"]} {NoAI:1b} {"text":"hi"} $(name)
timer kills deaths points health = += -= *= < > ><`.split(/\s+/),
};
