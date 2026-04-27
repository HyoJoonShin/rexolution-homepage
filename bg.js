const canvas = document.getElementById("ai-bg");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

for(let i=0; i<100; i++){
  particles.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    vx: (Math.random()-0.5)*1.5,
    vy: (Math.random()-0.5)*1.5
  });
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  particles.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
    ctx.fillStyle = "rgba(180,50,40,1)";
    ctx.fill();
  });

  for(let i=0;i<particles.length;i++){
    for(let j=i+1;j<particles.length;j++){
      let dx = particles[i].x - particles[j].x;
      let dy = particles[i].y - particles[j].y;
      let dist = Math.sqrt(dx*dx+dy*dy);

      if(dist < 160){
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = "rgba(180,50,40,0.35)";
        ctx.stroke();
      }
    }
  }

  particles.forEach(p=>{
    p.x += p.vx;
    p.y += p.vy;

    if(p.x<0 || p.x>canvas.width) p.vx *= -1;
    if(p.y<0 || p.y>canvas.height) p.vy *= -1;
  });

  requestAnimationFrame(draw);
}

draw();

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});