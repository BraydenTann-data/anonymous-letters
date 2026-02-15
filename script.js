const button = document.querySelector("button");
const textarea = document.querySelector("textarea");

// Create area to show letters
const letterArea = document.createElement("div");
letterArea.style.marginTop = "40px";
document.body.appendChild(letterArea);

button.addEventListener("click", () => {
  const text = textarea.value.trim();

  if (text.length === 0) {
    alert("Please write something first.");
    return;
  }

  // Create new letter
  const letter = document.createElement("div");
  letter.style.background = "rgba(255,255,255,0.1)";
  letter.style.padding = "10px";
  letter.style.margin = "10px";
  letter.style.borderRadius = "10px";
  letter.innerText = text;

  // Add to page
  letterArea.prepend(letter);

  // Clear input
  textarea.value = "";
});
