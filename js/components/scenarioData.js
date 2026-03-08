// src/components/scenarioData.js

export const scenarios = [
  {
    title: "📧 Phishing Email",
    description:
      "You receive an email claiming to be from your bank asking you to reset your password using a link.",
    options: [
      {
        text: "Click the link and enter your credentials.",
        score: -80,
        explanation:
          "This is risky. Phishing pages steal your credentials. You should never follow links from suspicious emails."
      },
      {
        text: "Ignore the email and manually visit the bank website.",
        score: 50,
        explanation:
          "Better. By typing the URL yourself, you avoid fake links and reduce phishing risk."
      },
      {
        text: "Forward the email to the security/IT team.",
        score: 100,
        explanation:
          "Best choice. You avoid the phishing attempt and help your organization detect and block similar attacks."
      }
    ]
  },
  {
    title: "📶 Free Public Wi-Fi",
    description:
      "You connect to free Wi-Fi at a coffee shop. A pop-up appears asking you to install a 'security update'.",
    options: [
      {
        text: "Install the update to stay secure.",
        score: -100,
        explanation:
          "Installing unknown software from an untrusted network is very dangerous. It could be malware."
      },
      {
        text: "Use a VPN and continue browsing without installing anything.",
        score: 80,
        explanation:
          "Using a VPN protects your traffic from eavesdropping, and you avoid installing untrusted software."
      },
      {
        text: "Disconnect from Wi-Fi and use mobile data instead.",
        score: 60,
        explanation:
          "Also a safe option. You avoid the potentially malicious Wi-Fi, but you still didn’t report anything."
      }
    ]
  },
  {
    title: "💾 USB on the Ground",
    description:
      "You find a USB drive on the floor near your office entrance.",
    options: [
      {
        text: "Plug it into your work PC to see what's on it.",
        score: -120,
        explanation:
          "This is a classic baiting attack. Unknown USBs can contain malware that auto-executes when plugged in."
      },
      {
        text: "Give it to the IT/security department.",
        score: 100,
        explanation:
          "Best practice. IT can safely analyze it in a sandboxed environment."
      },
      {
        text: "Leave it there and walk away.",
        score: 20,
        explanation:
          "Better than plugging it in, but reporting it is even more responsible."
      }
    ]
  },
  {
    title: "🔐 Password Sharing",
    description:
      "A coworker messages you saying they forgot the shared account password and asks you to send it.",
    options: [
      {
        text: "Send them the password over chat so they can work.",
        score: -70,
        explanation:
          "Sharing passwords, especially over chat, increases the risk of account compromise and breaks security policy."
      },
      {
        text: "Ask them to open an IT ticket or use password reset.",
        score: 80,
        explanation:
          "Correct. Use official processes for access instead of informally sharing passwords."
      },
      {
        text: "Ignore the message completely.",
        score: 10,
        explanation:
          "You avoided sharing, but it’s better to guide them to the proper procedure."
      }
    ]
  },
  {
    title: "📂 Suspicious Attachment",
    description:
      "You receive an email from an unknown sender with an attachment titled 'Invoice_2025.zip'.",
    options: [
      {
        text: "Download and open the attachment to check the invoice.",
        score: -90,
        explanation:
          "Unknown attachments are a common malware delivery method. Opening them can infect your machine."
      },
      {
        text: "Report the email as spam/phishing and delete it.",
        score: 100,
        explanation:
          "Best choice. You protect yourself and help improve spam/phishing filters."
      },
      {
        text: "Reply and ask them who they are.",
        score: -20,
        explanation:
          "Engaging with unknown senders can validate your email and invite more targeted attacks."
      }
    ]
  }
];
