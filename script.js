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

  let spinTime = 0;
  let fastSpinDuration = 15000; // 15 сек швидке обертання
  let slowSpinDuration = 5000;  // 5 сек плавне гальмування
  let spinAngle = 25; // швидкість у градусах за крок

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
    // швидкість плавно зменшується від 25 → 0
    let currentSpeed = spinAngle * (1 - spinTime / slowSpinDuration);
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
