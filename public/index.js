const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// Create engine and world
const engine = Engine.create();
const world = engine.world;

// Create renderer and attach to canvas
const canvas = document.getElementById("world");
canvas.width = 800;
canvas.height = 600;

const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: 800,
    height: 600,
    wireframes: false,
    background: '#fafafa'
  }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Ground
const ground = Bodies.rectangle(400, 590, 810, 60, { isStatic: true });
World.add(world, ground);

// Box to drop
const box = Bodies.rectangle(400, 100, 80, 80);
World.add(world, box);

// Update Y position in <div>
const posDiv = document.getElementById("position");
Events.on(engine, 'afterUpdate', () => {
  posDiv.textContent = `Box Y Position: ${box.position.y.toFixed(2)}`;
});
