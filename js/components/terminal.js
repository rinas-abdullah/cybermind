// src/components/terminal.js

export function openTerminal() {
  const box = document.getElementById("terminalContainer");
  box.classList.remove("hidden");

  box.innerHTML = `
    <div class="terminal">
      <h3>💻 CyberMind Terminal</h3>
      <pre id="terminalOutput">
> system scan starting...
> checking network activity...
> no critical threats detected.
> type "help" for commands.
      </pre>
      <input id="terminalInput" placeholder="Type a command..." />
    </div>
  `;

  const input = document.getElementById("terminalInput");
  const output = document.getElementById("terminalOutput");

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const cmd = input.value.trim();
      if (!cmd) return;

      handleCommand(cmd, output);
      input.value = "";
    }
  });
}

function handleCommand(cmd, output) {
  let response = "";

  switch (cmd.toLowerCase()) {
    case "help":
      response = "Available commands: help, status, tips, clear";
      break;
    case "status":
      response = "All systems operational. Monitoring threats...";
      break;
    case "tips":
      response =
        "Security Tip: Always verify URLs before entering your credentials.";
      break;
    case "clear":
      output.textContent = "";
      return;
    default:
      response = `Unknown command: ${cmd}`;
  }

  output.textContent += `\n> ${cmd}\n${response}`;
}
