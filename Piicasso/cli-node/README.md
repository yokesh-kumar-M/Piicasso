# piicasso (Node CLI)

Command-line client for the [PIIcasso](https://github.com/yokesh-kumar-M/Piicasso) platform. It combines local PII and password utilities with authenticated calls to the PIIcasso API.

## Requirements and installation

The CLI requires **Node.js 24 or newer**.

```bash
npm install --global piicasso
piicasso --version
```

Running `piicasso` without arguments starts the interactive REPL.

## Local and API-backed behavior

These commands run locally and do not require an account:

- `analyze`
- `redact`
- `score`
- `wordgen`
- `mode`
- `config`

These commands call the configured backend and, except for `login`, require a valid session:

- `login`, `logout`, `whoami`
- `submit`
- `history`
- `darkweb`
- `risk`
- `inbox`

The default API URL is stored by the package, but its availability is not guaranteed by this README. Override it with `PIICASSO_API` or `piicasso config set api <url>`.

## Quick start

```bash
# Local operations
piicasso analyze "jane@example.com 9876543210"
piicasso redact "Contact jane@example.com"
piicasso score "ExamplePassword42!" --profile username=jane birth_year=1990
piicasso wordgen --profile name=Jane birth_year=1990 --limit 20

# API operations
piicasso login
piicasso submit --profile full_name="Jane Doe" birth_year=1990 current_city=Chennai --pattern-mode deep
piicasso history --limit 10
piicasso darkweb "example organization"
piicasso risk
piicasso inbox

# Interactive REPL
piicasso
```

`submit` does not accept a positional file. `risk` does not accept a target; it reads the current authenticated user's snapshot.

## Commands

| Command                                                  | Execution          | Description                                            |
| -------------------------------------------------------- | ------------------ | ------------------------------------------------------ |
| `analyze [text] [-f path] [--json]`                      | Local              | Detect PII entities in text or a UTF-8 file            |
| `redact [text] [-f path] [--json]`                       | Local              | Replace detected values with `[TYPE]` placeholders     |
| `score <password> [-p key=value ...] [--json]`           | Local              | Score a password against optional profile values       |
| `wordgen -p key=value ... [-l N] [--json]`               | Local              | Generate at most `N` local candidates; default `40`    |
| `submit -p key=value ... [--pattern-mode mode] [--json]` | API                | Submit a recognized structured PII profile             |
| `history [-l N] [--json]`                                | API                | List recent analyses; default limit `20`               |
| `darkweb <query> [--json]`                               | API                | Query the configured breach-search workflow            |
| `risk [--json]`                                          | API                | Read the authenticated user's financial-risk snapshot  |
| `inbox [--json]`                                         | API                | List operations-inbox messages                         |
| `login`                                                  | API                | Prompt for credentials and store the returned JWT pair |
| `logout`                                                 | Local              | Remove stored authentication fields                    |
| `whoami`                                                 | API/local fallback | Read the profile endpoint, with stored-token fallback  |
| `mode [user\|security]`                                  | Local              | Read or set the REPL color mode                        |
| `config <list\|get\|set\|unset> [key] [value]`           | Local              | Inspect or modify CLI configuration                    |
| `repl` or no arguments                                   | Mixed              | Start the interactive prompt                           |

Use `piicasso <command> --help` for command-specific syntax. Only commands that define `--json` support JSON output.

## Structured `submit` contract

Pass one or more `key=value` values after the variadic `--profile` option. Values may contain `=`; the first `=` separates the key from its value.

```bash
piicasso submit \
  --profile full_name="Jane Doe" birth_year=1990 employer_name="Example Ltd" \
  --pattern-mode corporate
```

The Node CLI rejects malformed pairs, unsupported profile keys, and profiles without a non-empty value before making the API call.

### Pattern modes

`--pattern-mode` defaults to `standard` and accepts exactly:

- `standard`
- `corporate`
- `leetspeak`
- `deep`

### Recognized profile keys

The CLI currently recognizes these API profile keys:

| Category             | Keys                                                                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity             | `full_name`, `birth_year`, `phone_suffix`, `gov_id`, `passport_id`, `mother_maiden`, `blood_type`, `height`, `username`, `email`                                                                |
| Relationships        | `pet_names`, `spouse_name`, `childhood_nickname`, `social_handles`, `relationship_status`, `close_contacts`, `group_affiliations`, `child_names`, `father_name`, `sibling_names`, `best_friend` |
| Location and travel  | `hometown`, `school_name`, `last_location`, `travel_history`, `live_coordinates`, `frequent_places`, `current_city`, `street_name`, `zip_code`, `state`, `country`, `vacation_spot`             |
| Interests and habits | `favourite_movies`, `sports_team`, `first_car_model`, `shopping_sites`, `habit_patterns`, `search_keywords`, `content_timing`, `favourite_food`, `musician`, `hobbies`, `books`, `games`        |
| Work and education   | `employer_name`, `social_media_handle`, `job_title`, `department`, `employee_id`, `boss_name`, `past_company`, `university`, `degree`                                                           |
| Assets               | `bank_suffix`, `crypto_wallet`, `vehicle_reg`, `property_id`, `plate_number_partial`, `bank_name`, `brand_affinity`, `device_type`, `subscription`                                              |

The backend OpenAPI schema documents the recognized fields and pattern enum. The API requires meaningful non-pattern PII and rejects undeclared keys or profile values longer than 256 characters.

On success, the API returns HTTP `201` with a scored wordlist and metrics envelope. The normal CLI output prints a short summary; `--json` prints the complete response.

## Input and output examples

Read analysis input from a file:

```bash
piicasso analyze --file ./sample.txt
piicasso redact --file ./sample.txt
```

Produce machine-readable output:

```bash
piicasso analyze "jane@example.com" --json
piicasso submit --profile full_name="Jane Doe" --pattern-mode standard --json
piicasso risk --json
```

Local `wordgen` and `score` accept general profile keys. The stricter recognized-key list above applies to the API-backed `submit` command.

## Authentication and configuration

The CLI stores configuration in `~/.piicasso/config.json`:

```json
{
  "api": "https://example.invalid/api/",
  "mode": "user",
  "access": "<JWT>",
  "refresh": "<JWT>",
  "user": {
    "identifier": "example"
  }
}
```

Configuration writes are atomic. On POSIX-compatible systems, the CLI requests directory mode `0700` and file mode `0600`; platform filesystem semantics still apply. Treat this file as a credential and never commit or share it.

API base URL precedence is:

1. `PIICASSO_API` environment variable
2. `api` in `~/.piicasso/config.json`
3. Package default

Examples:

```bash
piicasso config list
piicasso config set api http://localhost:8000/api/
piicasso config get api
piicasso config unset api

# One-process override
PIICASSO_API=http://localhost:8000/api/ piicasso history
```

Access-token expiry triggers one refresh attempt. If the server rotates the refresh token, the CLI persists the new access and refresh pair together. An unusable session is cleared and reported as expired.

## Modes and REPL

- `user`: cyan prompt
- `security`: red prompt

```bash
piicasso mode security
piicasso repl
```

Inside the REPL, use `switch user` or `switch security`. Run `help` to see the REPL command list.

## Development

Clone the repository, then install exactly the locked dependency tree:

```bash
git clone https://github.com/yokesh-kumar-M/Piicasso.git
cd Piicasso/Piicasso/cli-node
npm ci
npm test
npm link
piicasso --version
```

`npm test` runs the Node test suite and a CLI version smoke test.

Before publishing:

```bash
npm test
npm pack --dry-run
npm publish --access public
```

Publishing requires registry authorization and should follow the project's release process.

## License

Licensed under the [Apache License 2.0](LICENSE).
