# piicasso (CLI)

Command-line interface for the [PIIcasso](https://github.com/yokesh-kumar-M/Piicasso) platform — PII exposure intelligence and adversarial wordlist generation.

The CLI is **hybrid**: PII analysis, redaction, password scoring, and wordlist generation run **locally** (no network, no login). AI-backed features (dark-web search, financial-risk scoring, server-side analysis, history, inbox) hit the deployed backend.

## Install

```bash
npm install -g piicasso
```

Requires Node.js >= 18.

## Quick start

```bash
# Local — no login required
piicasso analyze "john@example.com 9876543210"
piicasso wordgen --profile name=John --profile dob=1998 --limit 20
piicasso score "Password123!"

# API — needs a backend account
piicasso login
piicasso darkweb "acme corp"
piicasso risk "acme corp"
piicasso history

# Interactive REPL (matches the in-browser terminal)
piicasso
```

## Commands

| Command | Mode | Description |
| --- | --- | --- |
| `analyze [text] [-f path]` | local | Detect PII entities in text |
| `redact [text] [-f path]` | local | Replace PII with `[TYPE]` placeholders |
| `score <password> [-p k=v ...]` | local | Score a password against a profile |
| `wordgen -p k=v ... [-l N]` | local | Generate adversarial wordlist |
| `submit <file>` | API | Upload text for server-side analysis |
| `history [-l N]` | API | List recent analyses |
| `darkweb <query>` | API | Breach-search |
| `risk <target>` | API | Financial-risk score |
| `inbox` | API | List messages |
| `login` / `logout` / `whoami` | API | Manage credentials |
| `mode [user\|security]` | local | Show/set local theme |
| `config <action> [key] [value]` | local | Inspect/mutate `~/.piicasso/config.json` |
| *(no args)* | — | Enter interactive REPL |

All commands accept `--json` for machine-readable output where it makes sense.

## Configuration

The CLI stores its state in `~/.piicasso/config.json`:

```json
{
  "api":     "https://core-engine-woeg.onrender.com/api/",
  "mode":    "user",
  "access":  "<JWT>",
  "refresh": "<JWT>"
}
```

Override the API base with the `PIICASSO_API` environment variable or `piicasso config set api <url>`.

## Modes

- **user** — cyan prompt (`user@piicasso:~$`), friendly hacker palette
- **security** — red prompt (`sec@piicasso:~#`), aggressive ops palette

Switch with `piicasso mode security` or inside the REPL via `switch security`.

## Development

```bash
git clone https://github.com/yokesh-kumar-M/Piicasso
cd Piicasso/cli-node
npm install
npm link            # exposes the global `piicasso` binary from source
piicasso --version
```

## Publishing

```bash
npm login
npm publish --access public
```

The `files` array in `package.json` already restricts the tarball to `bin/`, `src/`, `README.md`, and `LICENSE`.

## License

MIT
