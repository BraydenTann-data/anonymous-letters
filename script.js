// ============================
// 🔴 PUT YOUR SUPABASE DETAILS
// ============================
const SUPABASE_URL = "https://nqsumxzqlgjefkvciiix.supabase.co";
const SUPABASE_KEY = "sb_publishable_W0rmerp-W72faEsZTT8NAg_ETYK-pTw";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================
// ELEMENTS
// ============================
const lettersDiv = document.getElementById("letters");
const submitBtn = document.getElementById("submit");
const textarea = document.getElementById("content");
const moodSelect = document.getElementById("mood");
const status = document.getElementById("status");

const toInput = document.getElementById("to_name");
const fromInput = document.getElementById("from_name");
const anonCheck = document.getElementById("anon");

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
  setTimeout(() => (status.innerText = ""), 3000);
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

  data.forEach((l) => {
    const div = document.createElement("div");
    div.className = "letter";

    const toLine = l.to_name
      ? `<div><strong>To:</strong> ${escapeHTML(l.to_name)}</div>`
      : "";

    const fromLine = l.is_anonymous
      ? `<div><strong>From:</strong> Anonymous</div>`
      : `<div><strong>From:</strong> ${escapeHTML(l.from_name || "Someone")}</div>`;

    div.innerHTML = `
      <div class="mood">${l.mood ? l.mood : "—"}</div>
      ${toLine}
      ${fromLine}
      <div style="margin-top:6px;">${escapeHTML(l.content)}</div>

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
  const to_name = toInput.value || null;
  const is_anonymous = anonCheck.checked;
  const from_name = is_anonymous ? null : fromInput.value || "Someone";

  if (text.length < 5) {
    showStatus("Write a little more.");
    return;
  }

  if (unsafe(text)) {
    showStatus("Please rephrase sensitive content.");
    return;
  }

  showStatus("Publishing...");

  const { error } = await supabaseClient.from("letters").insert([
    {
      content: text,
      mood,
      to_name,
      from_name,
      is_anonymous,
    },
  ]);

  if (error) {
    console.error(error);
    showStatus("Failed.");
    return;
  }

  // Clear
  textarea.value = "";
  moodSelect.value = "";
  toInput.value = "";
  fromInput.value = "";
  anonCheck.checked = true;

  showStatus("Published.");
  loadLetters();
});

// ============================
// REACTIONS (ANTI SPAM)
// ============================
function wireReactions() {
  document.querySelectorAll(".reactBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const type = btn.dataset.type;

      const lockKey = `reacted_${id}_${type}`;

      if (localStorage.getItem(lockKey)) {
        showStatus("You already reacted.");
        return;
      }

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

      localStorage.setItem(lockKey, "yes");
      btn.textContent = btn.textContent.replace(current, next);
    });
  });
}

// ============================
// PREVENT XSS
// ============================
function escapeHTML(str) {
  if (!str) return "";
  return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// Load at start
loadLetters();
