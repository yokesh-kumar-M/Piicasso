# piicasso

Command-line interface for **PIIcasso** — a PII exposure intelligence and
adversarial wordlist platform. The CLI is a hybrid: it runs the PII detection,
redaction, password scoring, and wordlist generation engine *locally* (no
network, instant), and it talks to the PIIcasso API for authenticated
features such as history, dark-web breach search, financial risk radar, and
the inbox.

## Install

From PyPI (once published):

```bash
pip install piicasso
```

From source (this repository):

```bash
cd cli-python
pip install -e .
```

Python 3.9 or newer is required.

## Quick start

```bash
piicasso --version
piicasso --help
piicasso                                    # interactive REPL
piicasso analyze "Email me at john@example.com or call 9876543210"
piicasso redact  "SSN: 123-45-6789"
piicasso score   'P@ssw0rd!' --profile name=John --profile dob=1998
piicasso wordgen --profile name=John --profile dob=1998 --limit 40
```

## Authenticated commands

```bash
piicasso login                              # prompts for email + password
piicasso whoami
piicasso submit ./report.txt
piicasso history --limit 20
piicasso darkweb "john@example.com"
piicasso risk    "Acme Corp"
piicasso inbox
piicasso logout
```

The CLI stores credentials in `~/.piicasso/config.json`. Override the API
base URL with the `PIICASSO_API` environment variable or:

```bash
piicasso config set api https://my-piicasso.example.com/api/
piicasso config get api
```

## Modes

PIIcasso has two operational modes that change the REPL prompt and accent
colour:

* `user` — defensive, cyan prompt (`user@piicasso:~$`)
* `security` — offensive ops, red prompt (`sec@piicasso:~#`)

Switch with `piicasso mode user|security` or inside the REPL with
`switch user` / `switch security`.

## Local engine commands

| command   | description                                            |
| --------- | ------------------------------------------------------ |
| `analyze` | detect PII entities in text (EMAIL, PHONE, SSN, ...) |
| `redact`  | mask detected PII inline (returns redacted text)      |
| `score`   | crackability score for a password (0–100 + rating)    |
| `wordgen` | adversarial wordlist from a profile (`name=...`, ...) |

All four are pure-Python, deterministic, and require no network.

## Build & publish (maintainers)

```bash
python -m pip install --upgrade build twine
python -m build              # produces dist/*.tar.gz and dist/*.whl
twine check dist/*
twine upload dist/*          # to PyPI
```

## License

MIT — see [LICENSE](LICENSE).
