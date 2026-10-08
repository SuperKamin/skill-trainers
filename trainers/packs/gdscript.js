// GDScript (Godot 4): keywords, built-ins and everyday bits, each typed as one "word".
// Written for this app from the language's public keywords and API names.
export default {
  id: 'gd',
  name: 'GDScript',
  code: true,
  words: `func var const extends class_name signal enum static return if elif else for while in match
break continue pass await and or not is as true false null self super
preload() load() print() push_back() append() erase() size() is_empty() has() keys() values()
queue_free() emit() connect() get_node() add_child() get_tree() get_parent() free()
@onready @export @export_range @tool _ready(): _process(delta): _physics_process(delta): _input(event):
-> void: :int :float :bool :String := += -= *= == != >= <= [] {} () " , : .
int float bool String Array Dictionary Vector2 Vector3 Vector2i Color Node Node2D Node3D
CharacterBody2D Area2D Sprite2D Timer Label Button Camera2D AnimationPlayer
$Sprite2D $Timer $AnimationPlayer %Label velocity position rotation scale delta speed
move_and_slide() is_on_floor() Input is_action_pressed() is_action_just_pressed() get_axis()
lerp() clamp() randf() randi() abs() min() max() sqrt() deg_to_rad() Vector2.ZERO Vector2.UP
direction gravity health damage player enemy jump_velocity
change_scene_to_file() play() stop() start() timeout body_entered pressed`.split(/\s+/),
};
