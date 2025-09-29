// 🔑 встав свої ключі з Supabase
const SUPABASE_URL = "https://axkokrmdggycjiglxnxj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4a29rcm1kZ2d5Y2ppZ2x4bnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODE4MjYsImV4cCI6MjA3Mzk1NzgyNn0.zAtjm08AcpoWAnIiDVGKiTsIq19iWP5aCxCLn7ZfznM";

const { createClient } = supabase;
const supa = createClient(SUPABASE_URL, SUPABASE_KEY);

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spinButton");
const resultText = document.getElementById("result");

let users = [];
let colors = ["#4DB6FF", "#FF4D4D", "#8AFF4D", "#FF8AFF", "#FFD700"];
let startAngle = 0;
let arc;
let spinning = false;

// завантаження користувачів із supabase
async function loadUsers() {
  const { data, error } = await supa
    .from("contest_users")
    .select("telegram_name, telegram_id");

  if (error) {
    console.error("Помилка завантаження:", error);
    return;
  }

  users = data.map(u => u.telegram_name);

  if (!users.length) {
    users = ["User01","User02","User03","User04","User05","User06"];
  }

  arc = Math.PI * 2 / users.length;
  drawWheel();
}

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  users.forEach((user, i) => {
    let angle = startAngle + i * arc;
    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.moveTo(canvas.width/2, canvas.height/2);
    ctx.arc(canvas.width/2, canvas.height/2, 240, angle, angle + arc);
    ctx.lineTo(canvas.width/2, canvas.height/2);
    ctx.fill();

    // текст
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(angle + arc/2);
    ctx.textAlign = "right";
    ctx.font = "16px Arial";
    ctx.fillText(user, 220, 5);
    ctx.restore();
  });
}

function spin() {
  if (spinning || !users.length) return;
  spinning = true;

  // 🎲 випадковий переможець
  let randomIndex = Math.floor(Math.random() * users.length);

  // обчислюємо кут для зупинки
  let targetAngle = 360 - (randomIndex * arc * 180/Math.PI + arc*180/(2*Math.PI));
  targetAngle += 360 * 5; // додаємо 5 обертів

  let currentAngle = startAngle * 180/Math.PI;
  let finalAngle = currentAngle + ((targetAngle - currentAngle) % 360 + 360) % 360;

  let duration = 5000; // 5 секунд
  let startTime = null;

  function animateSpin(timestamp) {
    if (!startTime) startTime = timestamp;
    let progress = (timestamp - startTime) / duration;

    if (progress >= 1) {
      startAngle = finalAngle * Math.PI/180;
      drawWheel();
      resultText.innerText = "🎉 Переможець: " + users[randomIndex];
      spinning = false;
      return;
    }

    // easing (easeOutCubic)
    let ease = 1 - Math.pow(1 - progress, 3);
    let angle = currentAngle + (finalAngle - currentAngle) * ease;
    startAngle = angle * Math.PI/180;
    drawWheel();
    requestAnimationFrame(animateSpin);
  }

  requestAnimationFrame(animateSpin);
}

spinButton.addEventListener("click", spin);

// завантажуємо дані з бази при старті
loadUsers();