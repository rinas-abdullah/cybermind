// src/components/terminal.js

let terminalInitialized = false;

export function openTerminal() {
  const box = document.getElementById("terminalContainer");
  if (!box) return;

  box.classList.remove("hidden");

  box.innerHTML = `
    <div class="terminal">
      <h3>💻 Risaq Terminal | رِسَاق</h3>

      <pre id="terminalOutput">
> Risaq Security Terminal | رِسَاق
> system scan starting...
> checking network activity...
> no critical threats detected.
> type "help" for commands.
      </pre>

      <input 
        id="terminalInput" 
        placeholder="Type a command..." 
        autocomplete="off"
      />
    </div>
  `;

  const input = document.getElementById("terminalInput");
  const output = document.getElementById("terminalOutput");

  if (!terminalInitialized) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cmd = input.value.trim();
        if (!cmd) return;

        handleCommand(cmd, output);
        input.value = "";
      }
    });

    terminalInitialized = true;
  }

  input.focus();
}

function handleCommand(cmd, output) {
  let response = "";
  const command = cmd.toLowerCase();

  switch (command) {

    case "help":
      response =
        "Commands:\n" +
        "help   - show commands\n" +
        "status - system status\n" +
        "tips   - security tip\n" +
        "clear  - clear terminal\n" +
        "exit   - close terminal";
      break;

    case "status":
      response = "All systems operational. Monitoring threats...";
      break;

    case "tips":
      response =
        "Security Tip: Always verify URLs before entering credentials.";
      break;

    case "clear":
      output.textContent =
        "> Risaq Terminal | رِسَاق\n> terminal cleared\n> type 'help' for commands";
      return;

    case "exit":
      closeTerminal();
      return;

    default:
      response = `Unknown command: ${cmd}`;
  }

  output.textContent += `\n> ${cmd}\n${response}`;
  output.scrollTop = output.scrollHeight;
}

function closeTerminal() {
  const box = document.getElementById("terminalContainer");
  if (!box) return;

  box.classList.add("hidden");
  box.innerHTML = "";
}