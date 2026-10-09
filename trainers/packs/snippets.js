// Code snippets: the "quote" test for code packs. Real little pieces of code, written for this app.
// \n = new line (Enter), \t = one indentation step (Tab; GDScript uses tabs). Lines never end in spaces.
// Grouped by length like quotes (short ≤ 100 characters, medium ≤ 300, long ≤ 600) — see quotes.js.
// GDScript is Godot 4; mcfunction is Minecraft Java Edition.

export const SNIPPETS = {
  gd: [
    { t: 'func jump() -> void:\n\tif is_on_floor():\n\t\tvelocity.y = jump_velocity', by: 'Jump' },
    { t: 'func add_coin() -> void:\n\tcoins += 1\n\tlabel.text = str(coins)', by: 'Collect a coin' },
    { t: 'func _ready() -> void:\n\thealth = max_health\n\ttimer.start()', by: 'Get ready' },
    { t: 'func _process(delta: float) -> void:\n\tif velocity.x != 0:\n\t\tsprite.flip_h = velocity.x < 0', by: 'Face the way you move' },
    { t: 'signal died\n\nvar health := 100\n\nfunc take_damage(amount: int) -> void:\n\thealth -= amount\n\tif health <= 0:\n\t\tdied.emit()\n\t\tqueue_free()', by: 'Take damage' },
    { t: 'func heal(amount: int) -> void:\n\thealth = min(health + amount, max_health)\n\thealth_changed.emit(health)\n\tif health == max_health:\n\t\tprint("full health")', by: 'Heal' },
    { t: 'extends Area2D\n\nsignal collected\n\nfunc _on_body_entered(body: Node2D) -> void:\n\tif body.is_in_group("player"):\n\t\tcollected.emit()\n\t\tqueue_free()', by: 'Coin pickup' },
    { t: 'var time_left := 10\n\nfunc _on_timer_timeout() -> void:\n\ttime_left -= 1\n\tlabel.text = str(time_left)\n\tif time_left <= 0:\n\t\ttimer.stop()\n\t\tprint("time is up")', by: 'Countdown' },
    { t: 'extends CharacterBody2D\n\nconst SPEED = 300.0\nconst JUMP_VELOCITY = -400.0\n\nfunc _physics_process(delta: float) -> void:\n\tif not is_on_floor():\n\t\tvelocity += get_gravity() * delta\n\tif Input.is_action_just_pressed("jump") and is_on_floor():\n\t\tvelocity.y = JUMP_VELOCITY\n\tvar direction := Input.get_axis("left", "right")\n\tvelocity.x = direction * SPEED\n\tmove_and_slide()', by: 'Player movement' },
    { t: 'enum State { IDLE, RUN, JUMP }\n\nvar state := State.IDLE\n\nfunc _physics_process(delta: float) -> void:\n\tmatch state:\n\t\tState.IDLE:\n\t\t\tanim.play("idle")\n\t\t\tif Input.is_action_pressed("right"):\n\t\t\t\tstate = State.RUN\n\t\tState.RUN:\n\t\t\tanim.play("run")\n\t\t\tif Input.is_action_just_pressed("jump"):\n\t\t\t\tstate = State.JUMP\n\t\tState.JUMP:\n\t\t\tanim.play("jump")\n\t\t\tif is_on_floor():\n\t\t\t\tstate = State.IDLE', by: 'A small state machine' },
    { t: 'extends Node2D\n\n@export var enemy_scene: PackedScene\n@export var spawn_time := 2.0\n\n@onready var timer := $Timer\n\nfunc _ready() -> void:\n\ttimer.wait_time = spawn_time\n\ttimer.timeout.connect(_spawn)\n\ttimer.start()\n\nfunc _spawn() -> void:\n\tvar enemy := enemy_scene.instantiate()\n\tenemy.position = Vector2(randf_range(0, 800), 0)\n\tadd_child(enemy)', by: 'Enemy spawner' },
    { t: 'const SAVE_PATH := "user://save.txt"\n\nfunc save_score(score: int) -> void:\n\tvar file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)\n\tfile.store_line(str(score))\n\nfunc load_score() -> int:\n\tif not FileAccess.file_exists(SAVE_PATH):\n\t\treturn 0\n\tvar file := FileAccess.open(SAVE_PATH, FileAccess.READ)\n\treturn int(file.get_line())', by: 'Save and load a score' },
  ],
  mcf: [
    { t: 'tellraw @a {"text":"Welcome!"}\ngive @a minecraft:bread 5\ntp @a 0 64 0', by: 'Welcome' },
    { t: 'execute as @a at @s if block ~ ~-1 ~ minecraft:slime_block run effect give @s minecraft:jump_boost 1 5', by: 'Launch pad' },
    { t: 'execute as @a at @s if block ~ ~-1 ~ minecraft:glass run effect give @s minecraft:night_vision 10 0 true', by: 'Night vision floor' },
    { t: 'scoreboard objectives add kills playerKillCount\nscoreboard objectives setdisplay sidebar kills\nexecute as @a[scores={kills=10..}] run tellraw @s {"text":"10 kills!"}', by: 'Kill counter' },
    { t: 'scoreboard objectives add timer dummy\nscoreboard players add @a timer 1\nexecute as @a if score @s timer matches 200.. run title @s title {"text":"Time\'s up!"}\nscoreboard players set @a[scores={timer=200..}] timer 0', by: 'Timer' },
    { t: 'gamemode adventure @a\nclear @a\ntp @a 0 64 0\ngive @a minecraft:wooden_sword 1\ntitle @a title {"text":"Go!"}\nplaysound minecraft:entity.player.levelup master @a', by: 'Start the game' },
    { t: 'scoreboard objectives add deaths deathCount\nexecute as @a[scores={deaths=1..}] run tellraw @s {"text":"Try again!"}\nexecute as @a[scores={deaths=1..}] run tp @s 0 64 0\nscoreboard players set @a deaths 0', by: 'Death check' },
    { t: 'execute as @a at @s if block ~ ~-1 ~ minecraft:gold_block run spawnpoint @s ~ ~ ~\nexecute as @a at @s if block ~ ~-1 ~ minecraft:gold_block run tellraw @s {"text":"Checkpoint!"}\nexecute as @a at @s if block ~ ~ ~ minecraft:lava run kill @s', by: 'Parkour checkpoint' },
    { t: 'bossbar add game:boss {"text":"Boss"}\nbossbar set game:boss players @a\nsummon minecraft:zombie 0 64 0 {Tags:["boss"]}\neffect give @e[tag=boss] minecraft:strength 600 1\nexecute as @e[tag=boss] store result bossbar game:boss value run data get entity @s Health\nexecute unless entity @e[tag=boss] run tellraw @a {"text":"You win!"}', by: 'Boss fight' },
    { t: 'scoreboard objectives add coins dummy\nscoreboard objectives setdisplay sidebar coins\nexecute as @a[scores={coins=10..},tag=buy_sword] run give @s minecraft:iron_sword 1\nscoreboard players remove @a[scores={coins=10..},tag=buy_sword] coins 10\ntag @a remove buy_sword', by: 'Coin shop' },
  ],
};
