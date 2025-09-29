// 🔑 встав свої ключі з Supabase
const SUPABASE_URL = "https://axkokrmdggycjiglxnxj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4a29rcm1kZ2d5Y2ppZ2x4bnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzODE4MjYsImV4cCI6MjA3Mzk1NzgyNn0.zAtjm08AcpoWAnIiDVGKiTsIq19iWP5aCxCLn7ZfznM";

const { createClient } = supabase;
const supa = createClient(SUPABASE_URL, SUPABASE_KEY);

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spinButton");
const resultText = document.getElementById("result");

let users = []; // тут зберігатимемо імена з БД
let colors = ["#4DB6FF", "#FF4D4D"];
let startAngle = 0;
let arc;
let spinning = false;

// завантаження користувачів із supabase
async function loadUsers() {
  const { data, error } = await supa
    .from("contest_users") // 👉 назва твоєї таблиці
    .select("telegram_name, telegram_id");

  if (error) {
    console.error("Помилка завантаження:", error);
    return;
  }

  users = data.map(u => u.telegram_name);
  arc = Math.PI * 2 / users.length;
  drawWheel();

//   users = [
//   "User01","User02","User03","User04","User05",
//   "User06","User07","User08","User09","User10",
//   "User11","User12","User13","User14","User15",
//   "User16","User17","User18","User19","User20",
//   "User21","User22","User23","User24","User25",
//   "User26","User27","User28","User29","User30"
// ];

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

  let randomIndex = Math.floor(Math.random() * users.length); // 🎲 випадковий переможець
  let targetAngle = 360 - (randomIndex * arc * 180/Math.PI + arc*180/(2*Math.PI));
  targetAngle += 360 * 5; // ще +5 повних обертів для ефекту

  let currentAngle = startAngle * 180/Math.PI;
  let diff = (targetAngle - currentAngle) % 360;
  if (diff < 0) diff += 360;
  let finalAngle = currentAngle + diff;

  let duration = 5000; // 5 сек
  let startTime = null;

  function animateSpin(timestamp) {
    if (!startTime) startTime = timestamp;
    let progress = (timestamp - startTime) / duration;

    if (progress >= 1) {
      startAngle = finalAngle * Math.PI/180;
      drawWheel();
      resultText.innerText = "Переможець: " + users[randomIndex];
      spinning = false;
      return;
    }

    let ease = 1 - Math.pow(1 - progress, 3); // easeOut
    let angle = currentAngle + (finalAngle - currentAngle) * ease;
    startAngle = angle * Math.PI/180;
    drawWheel();
    requestAnimationFrame(animateSpin);
  }

  requestAnimationFrame(animateSpin);
}

  function rotateFast() {
    spinTime += 30;
    if (spinTime >= fastSpinDuration) {
      // після 15 сек переходимо на уповільнення
      spinTime = 0;
      rotateSlow();
      return;
    }
    startAngle += (spinAngle * Math.PI / 180);
    drawWheel();
    requestAnimationFrame(rotateFast);
  }

  function rotateSlow() {
    spinTime += 30;
    if (spinTime >= slowSpinDuration) {
      stopRotateWheel();
      return;
    }

    // 🔥 плавне сповільнення (cubic easeOut)
    let progress = spinTime / slowSpinDuration; // від 0 до 1
    let easing = 1 - Math.pow(1 - progress, 3); // кубічна крива
    let currentSpeed = spinAngle * (1 - easing);

    startAngle += (currentSpeed * Math.PI / 180);
    drawWheel();
    requestAnimationFrame(rotateSlow);
  }

  rotateFast();
}

function easeOut(t, b, c, d) {
  let ts = (t /= d) * t;
  let tc = ts * t;
  return b + c * (tc + -3 * ts + 3 * t); // плавне уповільнення
}


function stopRotateWheel() {
  let degrees = startAngle * 180 / Math.PI + 90;
  let arcd = arc * 180 / Math.PI;
  let index = Math.floor((360 - (degrees % 360)) / arcd) % users.length;
  resultText.innerText = "Побидитель: " + users[index];
  spinning = false;
}

spinButton.addEventListener("click", spin);

// завантажуємо дані з бази при старті
loadUsers();
