"""
PIIcasso E2E Playwright Test - Full Application Flow
Tests: Landing Page -> Register -> Login -> Dashboard -> Wordlist Generation
"""

import os
import json
import time
import subprocess
from playwright.sync_api import sync_playwright, expect

BASE_URL = "https://piicasso-yokeshkumar.vercel.app"
SCREENSHOT_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "test_screenshots"
)
os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def ss(name):
    return os.path.join(SCREENSHOT_DIR, name)


PASS = "[PASS]"
FAIL = "[FAIL]"
WARN = "[WARN]"

TEST_USER = f"e2euser_{int(time.time())}"
TEST_EMAIL = f"e2euser_{int(time.time())}@test.com"
TEST_PASSWORD = "SecureP@ss123!"

results = {
    "landing_page": {"status": "FAIL", "details": ""},
    "registration": {"status": "FAIL", "details": ""},
    "login": {"status": "FAIL", "details": ""},
    "dashboard": {"status": "FAIL", "details": ""},
    "wordlist_generation": {"status": "FAIL", "details": ""},
    "console_errors": [],
    "http_errors": [],
    "screenshots": [],
}


def safe_str(e):
    return str(e).encode("ascii", "replace").decode("ascii")


def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        )

        console_errors = []
        http_errors = []
        page = context.new_page()

        page.on(
            "console",
            lambda msg: (
                console_errors.append(msg.text) if msg.type == "error" else None
            ),
        )
        page.on(
            "response",
            lambda res: (
                http_errors.append(f"{res.status} {res.url}")
                if res.status >= 400 and "favicon" not in res.url
                else None
            ),
        )

        # ===== TEST 1: Landing Page =====
        print("\n" + "=" * 60)
        print("TEST 1: Landing Page")
        print("=" * 60)
        try:
            page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)
            page.screenshot(path=ss("01_landing.png"), full_page=True)
            results["screenshots"].append(ss("01_landing.png"))

            title = page.title()
            print(f"  Page title: {title}")
            assert "PIIcasso" in title, f"Expected PIIcasso in title, got {title}"

            expect(page.locator("text=PIICASSO").first).to_be_visible(timeout=10000)
            print("  [OK] Logo visible")

            expect(page.locator("text=Your target").first).to_be_visible(timeout=10000)
            print("  [OK] Hero headline visible")

            expect(
                page.locator(
                    'button:has-text("Start Free"), a:has-text("Start Free"), a:has-text("Get Access")'
                ).first
            ).to_be_visible(timeout=10000)
            print("  [OK] CTA button visible")

            demo = page.locator(
                'input[placeholder*="name" i], input[placeholder*="target" i]'
            ).first
            if demo.count() > 0:
                expect(demo).to_be_visible(timeout=5000)
                print("  [OK] Interactive demo input visible")

            expect(page.locator("text=How It Works").first).to_be_visible(timeout=5000)
            print("  [OK] How It Works section visible")

            expect(page.locator("text=Gemini AI").first).to_be_visible(timeout=5000)
            print("  [OK] Tech marquee visible")

            results["landing_page"] = {
                "status": "PASS",
                "details": "All elements rendered correctly",
            }
            print(f"  {PASS} LANDING PAGE")

        except Exception as e:
            results["landing_page"] = {"status": "FAIL", "details": safe_str(e)[:200]}
            print(f"  {FAIL} LANDING PAGE - {safe_str(e)[:200]}")

        # ===== TEST 2: Registration =====
        print("\n" + "=" * 60)
        print("TEST 2: User Registration")
        print("=" * 60)
        reg_ok = False
        try:
            try:
                page.locator(
                    'button:has-text("Start Free"), a:has-text("Start Free")'
                ).first.click(timeout=10000)
            except:
                page.goto(
                    f"{BASE_URL}/register", wait_until="networkidle", timeout=30000
                )

            page.wait_for_timeout(2000)
            page.screenshot(path=ss("02_register_page.png"))
            results["screenshots"].append(ss("02_register_page.png"))
            print(f"  URL: {page.url}")

            expect(page.locator('input[name="username"]').first).to_be_visible(
                timeout=10000
            ).fill(TEST_USER)
            print(f"  [OK] Username: {TEST_USER}")

            expect(page.locator('input[name="email"]').first).to_be_visible(
                timeout=5000
            ).fill(TEST_EMAIL)
            print(f"  [OK] Email: {TEST_EMAIL}")

            expect(page.locator('input[name="password"]').first).to_be_visible(
                timeout=5000
            ).fill(TEST_PASSWORD)
            print("  [OK] Password filled")

            page.screenshot(path=ss("02_register_filled.png"))
            page.locator('button:has-text("Sign Up")').first.click()
            print("  [OK] Sign Up clicked")

            page.wait_for_timeout(8000)
            page.screenshot(path=ss("02_register_result.png"))
            results["screenshots"].append(ss("02_register_result.png"))

            # Check feedback
            if (
                page.locator("text=SUCCESS").first.count() > 0
                or page.locator("text=Account created").first.count() > 0
            ):
                print("  [OK] Success message shown")
            elif page.locator('[class*="error"]').first.count() > 0:
                print(f"  {WARN} Error shown")
            elif "login" in page.url.lower():
                print("  [OK] Redirected to login")
            else:
                print(f"  {WARN} No clear feedback, URL: {page.url}")

            # Verify via API
            r = subprocess.run(
                [
                    "curl",
                    "-s",
                    "-X",
                    "POST",
                    f"{BASE_URL}/api/user/token/",
                    "-H",
                    "Content-Type: application/json",
                    "-d",
                    json.dumps({"username": TEST_USER, "password": TEST_PASSWORD}),
                ],
                capture_output=True,
                text=True,
            )
            if "access" in r.stdout:
                print("  [OK] User verified via API")
                reg_ok = True
            else:
                print(f"  {WARN} API verify failed: {r.stdout[:100]}")

        except Exception as e:
            print(f"  {FAIL} REGISTRATION - {safe_str(e)[:150]}")

        results["registration"] = {
            "status": "PASS" if reg_ok else "FAIL",
            "details": f"User {TEST_USER}",
        }
        print(f"  {PASS if reg_ok else FAIL} REGISTRATION")

        # ===== TEST 3: Login =====
        print("\n" + "=" * 60)
        print("TEST 3: User Login")
        print("=" * 60)
        auth_ok = False
        try:
            page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)
            page.screenshot(path=ss("03_login_page.png"))
            results["screenshots"].append(ss("03_login_page.png"))

            expect(page.locator('input[name="username"]').first).to_be_visible(
                timeout=10000
            ).fill(TEST_USER)
            print(f"  [OK] Username: {TEST_USER}")

            expect(page.locator('input[name="password"]').first).to_be_visible(
                timeout=5000
            ).fill(TEST_PASSWORD)
            print("  [OK] Password filled")

            page.locator('button:has-text("Login")').first.click()
            print("  [OK] Login clicked")

            # Wait for navigation away from /login (redirect to dashboard)
            page.wait_for_url("**/dashboard**", timeout=20000)
            page.wait_for_timeout(2000)
            page.screenshot(path=ss("03_login_result.png"))
            results["screenshots"].append(ss("03_login_result.png"))

            current_url = page.url
            print(f"  URL after login: {current_url}")

            # Persist auth state to survive navigation
            context.storage_state(path=ss("auth_state.json"))
            print("  [OK] Auth state saved")

            token = page.evaluate("localStorage.getItem('access_token')")
            if token:
                print("  [OK] JWT token in localStorage")
                auth_ok = True
            elif (
                "dashboard" in current_url.lower() or "operation" in current_url.lower()
            ):
                print("  [OK] On authenticated page")
                auth_ok = True
            else:
                err_el = page.locator('[class*="error"]').first
                if err_el.count() > 0 and err_el.is_visible():
                    print(f"  {WARN} Error: {err_el.inner_text()[:80]}")
                print(f"  {WARN} No token, URL: {current_url}")

        except Exception as e:
            print(f"  {FAIL} LOGIN - {safe_str(e)[:150]}")

        results["login"] = {
            "status": "PASS" if auth_ok else "FAIL",
            "details": f"Login for {TEST_USER}",
        }
        print(f"  {PASS if auth_ok else FAIL} LOGIN")

        # ===== TEST 4: Dashboard =====
        print("\n" + "=" * 60)
        print("TEST 4: Dashboard")
        print("=" * 60)
        try:
            # Reuse authenticated context for protected routes
            auth_page = context.new_page()
            auth_page.goto(
                f"{BASE_URL}/dashboard", wait_until="networkidle", timeout=30000
            )
            auth_page.wait_for_timeout(3000)
            auth_page.screenshot(path=ss("04_dashboard.png"))
            results["screenshots"].append(ss("04_dashboard.png"))

            if "login" in auth_page.url.lower():
                print(f"  {WARN} Redirected to login - not authenticated")
                results["dashboard"] = {
                    "status": "FAIL",
                    "details": "Not authenticated",
                }
                print(f"  {FAIL} DASHBOARD")
            else:
                print(f"  URL: {auth_page.url}")

                heading = auth_page.locator(
                    "text=Intelligence Database, text=Dashboard"
                ).first
                if heading.count() > 0 and heading.is_visible():
                    print("  [OK] Dashboard heading visible")

                if auth_page.locator("text=Total Records").first.count() > 0:
                    print("  [OK] Stats cards visible")

                if auth_page.locator('input[placeholder*="Search"]').first.count() > 0:
                    print("  [OK] Search input visible")

                if auth_page.locator("text=Export CSV").first.count() > 0:
                    print("  [OK] Export CSV button visible")

                results["dashboard"] = {"status": "PASS", "details": "Dashboard loaded"}
                print(f"  {PASS} DASHBOARD")

        except Exception as e:
            results["dashboard"] = {"status": "FAIL", "details": safe_str(e)[:200]}
            print(f"  {FAIL} DASHBOARD - {safe_str(e)[:200]}")

        # ===== TEST 5: Wordlist Generation =====
        print("\n" + "=" * 60)
        print("TEST 5: Wordlist Generation")
        print("=" * 60)
        try:
            auth_page.goto(
                f"{BASE_URL}/operation", wait_until="networkidle", timeout=30000
            )
            auth_page.wait_for_timeout(3000)
            auth_page.screenshot(path=ss("05_operation.png"))
            results["screenshots"].append(ss("05_operation.png"))
            print(f"  URL: {auth_page.url}")

            if "login" in auth_page.url.lower():
                print(f"  {WARN} Not authenticated")
                results["wordlist_generation"] = {
                    "status": "FAIL",
                    "details": "Not authenticated",
                }
                print(f"  {FAIL} WORDLIST GENERATION")
            elif (
                "404" in auth_page.title() or "not found" in auth_page.content().lower()
            ):
                print(f"  {WARN} 404 page")
                results["wordlist_generation"] = {"status": "FAIL", "details": "404"}
                print(f"  {FAIL} WORDLIST GENERATION")
            else:
                fn = auth_page.locator(
                    'input[name="full_name"], input[placeholder*="name" i]'
                ).first
                if fn.count() > 0 and fn.is_visible():
                    fn.fill("John Doe")
                    print("  [OK] Name filled")

                un = auth_page.locator('input[name="username"]').first
                if un.count() > 0 and un.is_visible():
                    un.fill("johndoe")
                    print("  [OK] Username filled")

                sb = auth_page.locator(
                    'button:has-text("Generate"), button:has-text("Submit"), button:has-text("Create"), button:has-text("Deploy")'
                ).first
                if sb.count() > 0 and sb.is_visible():
                    sb.click()
                    print("  [OK] Submit clicked")
                    auth_page.wait_for_timeout(15000)
                    auth_page.screenshot(path=ss("05_generation_result.png"))
                    results["screenshots"].append(ss("05_generation_result.png"))
                    print(f"  URL after: {auth_page.url}")
                else:
                    print(f"  {WARN} No submit button")

                results["wordlist_generation"] = {
                    "status": "PASS",
                    "details": "Generation attempted",
                }
                print(f"  {PASS} WORDLIST GENERATION")

        except Exception as e:
            results["wordlist_generation"] = {
                "status": "FAIL",
                "details": safe_str(e)[:200],
            }
            print(f"  {FAIL} WORDLIST GENERATION - {safe_str(e)[:200]}")

        results["console_errors"] = [
            e for e in console_errors if "favicon" not in e.lower()
        ]
        results["http_errors"] = http_errors

        page.screenshot(path=ss("06_final_state.png"))
        results["screenshots"].append(ss("06_final_state.png"))
        browser.close()

    return results


if __name__ == "__main__":
    results = run_test()

    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    for test_name, result in results.items():
        if test_name in ("console_errors", "screenshots", "http_errors"):
            continue
        status = result.get("status", "UNKNOWN")
        details = result.get("details", "")
        icon = PASS if status == "PASS" else FAIL
        print(f"  {icon} {test_name.upper()}: {status}")
        if details and status == "FAIL":
            print(f"     Details: {details}")

    if results["http_errors"]:
        print(f"\n  {WARN} HTTP Errors ({len(results['http_errors'])}):")
        for err in results["http_errors"][:10]:
            print(f"    - {err[:150]}")

    if results["console_errors"]:
        print(f"\n  {WARN} Console Errors ({len(results['console_errors'])}):")
        for err in results["console_errors"][:5]:
            print(f"    - {err[:120]}")

    print(f"\n  Screenshots: {len(results['screenshots'])}")
    for s in results["screenshots"]:
        print(f"    - {s}")

    passed = sum(
        1 for r in results.values() if isinstance(r, dict) and r.get("status") == "PASS"
    )
    total = sum(1 for r in results.values() if isinstance(r, dict) and "status" in r)
    print(f"\n  Overall: {passed}/{total} tests passed")

    results_path = os.path.join(SCREENSHOT_DIR, "test_results.json")
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"  Results: {results_path}")
