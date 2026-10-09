// GDScript (Godot 4), "makes sense": valid lines that belong together. Either one declaration
// (var / const / @export / @onready / signal) or a small block (a function with its body).
// Until code snippets can have real new lines, a block's lines are typed one after another on one line.
// sentence() → one line or block, as a string.

const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;

// [name, type, possible values]
const VARS = [
  ['speed', 'float', ['150.0', '200.0', '300.0']],
  ['health', 'int', ['100', '50', '3']],
  ['max_health', 'int', ['100', '10']],
  ['score', 'int', ['0']],
  ['coins', 'int', ['0', '10']],
  ['lives', 'int', ['3', '5']],
  ['gravity', 'float', ['980.0', '1200.0']],
  ['jump_velocity', 'float', ['-400.0', '-350.0']],
  ['is_alive', 'bool', ['true']],
  ['player_name', 'String', ['"Hero"', '"Player"']],
  ['damage', 'int', ['10', '25']],
];
const NODES = [['timer', 'Timer'], ['sprite', 'Sprite2D'], ['anim', 'AnimationPlayer'], ['label', 'Label'], ['camera', 'Camera2D'], ['hitbox', 'Area2D']];
const SIGNALS = ['signal died', 'signal health_changed(value: int)', 'signal coin_collected', 'signal level_finished'];
const ANIMS = ['"idle"', '"run"', '"jump"', '"hurt"'];
const COUNTERS = ['score', 'coins', 'points'];

function declaration() {
  const [name, type, values] = pick(VARS);
  const v = pick(values);
  return pick([
    () => `var ${name} := ${v}`,
    () => `var ${name}: ${type} = ${v}`,
    () => `@export var ${name}: ${type} = ${v}`,
    () => { const [n, , vs] = pick(VARS.filter(x => x[1] === 'int' || x[1] === 'float')); return `const MAX_${n.toUpperCase().replace(/^MAX_/, '')} = ${pick(vs)}`; },
    () => { const [n, t] = pick(NODES); return `@onready var ${n} := $${t}`; },
    () => pick(SIGNALS),
  ])();
}

const BLOCKS = [
  () => ['func jump() -> void:', 'if is_on_floor():', 'velocity.y = jump_velocity'],
  () => ['func take_damage(amount: int) -> void:', 'health -= amount', 'if health <= 0:', 'died.emit()', 'queue_free()'],
  () => { const c = pick(COUNTERS); return [`func add_${c === 'coins' ? 'coin' : 'point'}() -> void:`, `${c} += ${pick(['1', '5', '10'])}`, `label.text = str(${c})`]; },
  () => ['func _physics_process(delta: float) -> void:', 'velocity.y += gravity * delta', 'var direction := Input.get_axis("left", "right")', 'velocity.x = direction * speed', 'move_and_slide()'],
  () => ['func _ready() -> void:', pick(['timer.start()', `anim.play(${pick(ANIMS)})`, 'health = max_health', 'print("ready")'])],
  () => ['func heal(amount: int) -> void:', 'health = min(health + amount, max_health)', 'health_changed.emit(health)'],
  () => ['func _on_timer_timeout() -> void:', pick(['queue_free()', 'print("time is up")', 'lives -= 1', `anim.play(${pick(ANIMS)})`])],
  () => ['if Input.is_action_just_pressed("jump") and is_on_floor():', 'velocity.y = jump_velocity', `anim.play(${pick(['"jump"', '"run"'])})`],
  () => ['for i in range(' + pick(['3', '5', '10']) + '):', 'print(i)'],
  () => ['func _on_body_entered(body: Node2D) -> void:', 'if body.is_in_group("player"):', pick(['coin_collected.emit()', 'body.take_damage(damage)', 'queue_free()'])],
  () => ['match state:', '"idle":', `anim.play("idle")`, '"run":', 'anim.play("run")'],
];

export function sentence() {
  return chance(0.4) ? declaration() : pick(BLOCKS)().join(' ');
}
