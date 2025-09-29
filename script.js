// 🔑 вставь свои ключи из Supabase
const SUPABASE_URL = "https://axkokrmdggycjiglxnxj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4a29rcm1kZ2d5Y2ppZ2x4bnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODE4MjYsImV4cCI6MjA3Mzk1NzgyNn0.zAtjm08AcpoWAnIiDVGKiTsIq19iWP5aCxCLn7ZfznM";

const { createClient } = supabase;
const supa = createClient(SUPABASE_URL, SUPABASE_KEY);

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spinButton");
const resultText = document.getElementById("result");

let users = [];
let colors = ["#4DB6FF", "#FF4D4D"]; // 🔵 🔴 синий и красный
let startAngle = 0;
let arc;
let spinning = false;

// загрузка пользователей из supabase
async function loadUsers() {
  const { data, error } = await supa
    .from("contest_users")
    .select("telegram_name, telegram_id");

  if (error) {
    console.error("Ошибка загрузки:", error);
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

  let spins = 10; // количество полных оборотов
  let currentAngle = startAngle * 180 / Math.PI;
  let finalAngle = currentAngle + spins * 360 + Math.random() * 360;

  let fastDuration = 10000;  // 10 сек быстрая прокрутка
  let slowDuration = 20000;  // 20 сек замедление
  let startTime = null;

  function animateSpin(timestamp) {
    if (!startTime) startTime = timestamp;
    let elapsed = timestamp - startTime;

    if (elapsed < fastDuration) {
      // 🚀 быстрая прокрутка
      let progress = elapsed / fastDuration;
      let angle = currentAngle + progress * (spins * 180);
      startAngle = angle * Math.PI / 180;
      drawWheel();
      requestAnimationFrame(animateSpin);
    } else if (elapsed < fastDuration + slowDuration) {
      // 🐢 замедление
      let progress = (elapsed - fastDuration) / slowDuration;
      let ease = 1 - Math.pow(1 - progress, 3);
      let angle = currentAngle + spins * 180 + (finalAngle - currentAngle - spins * 180) * ease;
      startAngle = angle * Math.PI / 180;
      drawWheel();
      requestAnimationFrame(animateSpin);
    } else {
      // ✅ стоп
      startAngle = finalAngle * Math.PI / 180;
      drawWheel();
      showWinner();
      spinning = false;
    }
  }

  requestAnimationFrame(animateSpin);
}

function showWinner() {
  // угол в градусах
  let degrees = startAngle * 180 / Math.PI + 90;
  let arcd = arc * 180 / Math.PI;
  let index = Math.floor((360 - (degrees % 360)) / arcd) % users.length;

  resultText.innerText = "🎉 Победитель: " + users[index];
}

spinButton.addEventListener("click", spin);

// загрузка данных при старте
loadUsers();