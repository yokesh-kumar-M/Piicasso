import itertools
import re


class PatternEngineService:
    @staticmethod
    def mask_pii_for_api(pii_data):
        safe = dict(pii_data)
        for k in ["ssn_last4", "bank_name", "crypto_wallet", "gov_id", "passport_id", "bank_suffix"]:
            if safe.get(k):
                safe[k] = "[MASKED]"
        return safe

    @staticmethod
    def build_prompt(pii_data, pattern_mode="standard"):
        def fmt(key):
            val = pii_data.get(key)
            return f"- {key}: {val}" if val else None

        fields = [
            fmt(k)
            for k in [
                "full_name",
                "dob",
                "birth_year",
                "pets_name",
                "favorite_sport",
                "favorite_color",
                "favorite_food",
                "company_name",
                "vehicle_number",
                "anniversary_date",
                "partner_name",
                "children_names",
                "school_name",
                "college_name",
                "father_name",
                "mother_name",
                "hometown",
                "current_city",
                "best_friend",
                "dream_destination",
            ]
        ]
        active_fields = "\n".join([f for f in fields if f])

        mode_instructions = {
            "standard": "Generate common, highly probable passwords blending personal names, birth years, and common symbols (e.g., John@1990, Bella#2024).",
            "corporate": "Focus on enterprise patterns: CompanyNameYear!, SeasonYear, DeptMonth! (e.g., Acme2024!, Spring2023$, ITDept#123).",
            "leetspeak": "Aggressively apply leet substitutions (a->@/4, e->3, i->1/!, o->0, s->$): (e.g., J0hn@1990, P@$$w0rd2024, B3ll@!).",
            "deep": "Generate complex hybrid variants: Name+Pet+Year, Partner+Color+Symbol, Hometown+Sport! (e.g., JohnBella90!, ParisRed#2020).",
        }
        instruction = mode_instructions.get(pattern_mode, mode_instructions["standard"])

        return (
            f"Target PII Profile:\n{active_fields}\n\n"
            f"Pattern Strategy: {pattern_mode.upper()}\n"
            f"Strategy Directives: {instruction}\n"
            f"Generate a scored list of realistic password candidates."
        )

    @staticmethod
    def generate_deterministic_candidates(pii_data, pattern_mode="standard", limit=1000):
        names = []
        for key in ["full_name", "partner_name", "pets_name", "father_name", "mother_name", "best_friend"]:
            val = pii_data.get(key)
            if val:
                names.extend([w.strip().capitalize() for w in re.split(r"[\s\-_]+", str(val)) if len(w.strip()) >= 2])

        years = []
        for key in ["dob", "birth_year", "anniversary_date"]:
            val = str(pii_data.get(key, ""))
            matches = re.findall(r"\d{4}", val)
            years.extend(matches)
            for m in matches:
                years.append(m[2:])  # 2-digit year

        if not years:
            years = ["123", "2024", "2025", "2026", "01"]

        symbols = ["!", "@", "#", "$", "*", "123", ""]

        candidates = set()
        for name in names[:6]:
            for year in years[:6]:
                for sym in symbols:
                    candidates.add(f"{name}{year}{sym}")
                    candidates.add(f"{name}{sym}{year}")
                    candidates.add(f"{name.lower()}{year}{sym}")
                    if pattern_mode == "leetspeak":
                        leet = (
                            name.lower()
                            .replace("a", "@")
                            .replace("e", "3")
                            .replace("i", "1")
                            .replace("o", "0")
                            .replace("s", "$")
                        )
                        candidates.add(f"{leet}{year}{sym}")

        if not candidates:
            candidates.update(["P@ssw0rd2024!", "Secret123!", "Welcome2025!"])

        return list(candidates)[:limit]

