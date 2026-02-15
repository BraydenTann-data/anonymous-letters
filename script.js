// ============================
// 🔴 PUT YOUR SUPABASE DETAILS
// ============================
const SUPABASE_URL = "PASTE_URL_HERE";
const SUPABASE_KEY = "PASTE_ANON_KEY_HERE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================
const lettersDiv = document.getElementById("letters");
const submitBtn = document.getElementById("submit");
const textarea = document.getElementById("content");
const moodSelect = document.getElementById("mood");
const status = document.getElementById("status");

// ============================
// BASIC SAFETY FILTER
// ============================
const blocked = ["kill yourself", "suicide", "phone number", "address"];

function unsafe(text) {
  const lower = text.toLowerCase();
  return blocked.some(w => lower.includes(w));
}

function showStatus(msg) {
  status.innerText = msg;
  setTimeout(() => status.innerText = "", 3000);
}

// ============================
// LOAD LETTERS
// ============================
async function loadLetters() {
  lettersDiv.innerHTML = "Loading...";

  const { data, error } = await supabaseClient
    .from("letters")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    lettersDiv.innerHTML = "Failed to load.";
    return;
  }

  lettersDiv.innerHTML = "";

  data.forEach(l => {
    const div = document.createElement("div");
    div.className = "letter";

    div.innerHTML = `
      <div class="mood">${l.mood ? l.mood : "—"}</div>
      <div>${escapeHTML(l.content)}</div>

      <div class="reactions">
        <button class="reactBtn" data-id="${l.id}" data-type="hearts">❤️ ${l.hearts}</button>
        <button class="reactBtn" data-id="${l.id}" data-type="hugs">🫂 ${l.hugs}</button>
        <button class="reactBtn" data-id="${l.id}" data-type="heard">👂 ${l.heard}</button>
      </div>
    `;

    lettersDiv.appendChild(div);
  });

  wireReactions();
}

// ============================
// SAVE LETTER
// ============================
submitBtn.addEventListener("click", async () => {
  const text = textarea.value.trim();
  const mood = moodSelect.value || null;

  if (text.length < 5) {
    showStatus("Write a little more.");
    return;
  }

  if (unsafe(text)) {
    showStatus("Please rephrase sensitive content.");
    return;
  }

  showStatus("Publishing...");

  const { error } = await supabaseClient
    .from("letters")
    .insert([{ content: text, mood }]);

  if (error) {
    console.error(error);
    showStatus("Failed.");
    return;
  }

  textarea.value = "";
  moodSelect.value = "";

  showStatus("Published anonymously.");
  loadLetters();
});

// ============================
// REACTIONS
// ============================
function wireReactions() {
  document.querySelectorAll(".reactBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const type = btn.dataset.type;

      const current = parseInt(btn.textContent.replace(/\D/g, "")) || 0;
      const next = current + 1;

      const patch = {};
      patch[type] = next;

      const { error } = await supabaseClient
        .from("letters")
        .update(patch)
        .eq("id", id);

      if (error) {
        console.error(error);
        showStatus("Reaction failed.");
        return;
      }

      btn.textContent = btn.textContent.replace(current, next);
    });
  });
}

// ============================
// PREVENT XSS
// ============================
function escapeHTML(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Load at start
loadLetters();
