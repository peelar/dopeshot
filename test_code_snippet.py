from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # Navigate to the app
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    # Take initial screenshot
    page.screenshot(path='/tmp/initial_page.png', full_page=False)
    print("✓ Initial screenshot saved to /tmp/initial_page.png")

    # Find and click on the "Code" look selector
    # First, let's see what's on the page
    print("\n--- Looking for Code look selector ---")

    # Wait a bit for the page to fully render
    page.wait_for_timeout(2000)

    # Try to find the Code look button - it should have "Code" text
    code_look_button = page.locator('button:has-text("Code")')
    if code_look_button.count() > 0:
        print(f"Found {code_look_button.count()} button(s) with 'Code' text")
        code_look_button.first.click()
        page.wait_for_timeout(1000)
        print("✓ Clicked on Code look")
    else:
        print("Could not find Code look button, checking current state...")

    # Take screenshot after switching to Code look
    page.screenshot(path='/tmp/code_look.png', full_page=False)
    print("✓ Code look screenshot saved to /tmp/code_look.png")

    # Now inspect the canvas container
    print("\n--- Inspecting canvas container ---")

    # Find the invisible canvas container (should be 1280x720)
    canvas_container = page.locator('div').filter(has=page.locator('.code-snippet'))

    if canvas_container.count() > 0:
        # Get the canvas container's computed styles and dimensions
        canvas_info = canvas_container.first.evaluate('''(element) => {
            // Walk up to find the 1280x720 container
            let current = element;
            while (current && current.parentElement) {
                const styles = window.getComputedStyle(current);
                const width = current.offsetWidth;
                const height = current.offsetHeight;

                if (width === 1280 && height === 720) {
                    return {
                        width: width,
                        height: height,
                        background: styles.background,
                        backgroundColor: styles.backgroundColor,
                        border: styles.border,
                        backdropFilter: styles.backdropFilter,
                        display: styles.display,
                        justifyContent: styles.justifyContent,
                        alignItems: styles.alignItems,
                        position: current.getBoundingClientRect()
                    };
                }
                current = current.parentElement;
            }
            return null;
        }''')

        if canvas_info:
            print("\n✓ Found 1280x720 canvas container!")
            print(f"  Dimensions: {canvas_info['width']}x{canvas_info['height']}")
            print(f"  Background: {canvas_info['background']}")
            print(f"  Background Color: {canvas_info['backgroundColor']}")
            print(f"  Border: {canvas_info['border']}")
            print(f"  Backdrop Filter: {canvas_info['backdropFilter']}")
            print(f"  Display: {canvas_info['display']}")
            print(f"  Justify Content: {canvas_info['justifyContent']}")
            print(f"  Align Items: {canvas_info['alignItems']}")

            # Check if it's truly invisible
            is_invisible = (
                canvas_info['backgroundColor'] in ['rgba(0, 0, 0, 0)', 'transparent', ''] and
                canvas_info['backdropFilter'] == 'none' and
                'rgba(255, 255, 255, 0.14)' not in canvas_info['background']
            )

            if is_invisible:
                print("\n✅ Canvas is INVISIBLE (no background, no blur) - Just a container!")
            else:
                print("\n❌ Canvas has VISIBLE styling")
        else:
            print("Could not find 1280x720 container in parent hierarchy")

    # Check the code snippet itself
    print("\n--- Inspecting code snippet ---")
    code_snippet = page.locator('.code-snippet')

    if code_snippet.count() > 0:
        snippet_info = code_snippet.first.evaluate('''(element) => {
            const styles = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            const pre = element.querySelector('pre');
            const preStyles = pre ? window.getComputedStyle(pre) : null;

            return {
                width: rect.width,
                height: rect.height,
                borderRadius: styles.borderRadius,
                boxShadow: styles.boxShadow,
                background: preStyles ? preStyles.background : null,
                position: {
                    left: rect.left,
                    top: rect.top
                }
            };
        }''')

        print(f"\n✓ Code snippet dimensions: {snippet_info['width']}x{snippet_info['height']}")
        print(f"  Border Radius: {snippet_info['borderRadius']}")
        print(f"  Box Shadow: {snippet_info['boxShadow'][:50]}..." if len(snippet_info['boxShadow']) > 50 else f"  Box Shadow: {snippet_info['boxShadow']}")
        print(f"  Background: {snippet_info['background']}")
        print(f"  Position: left={snippet_info['position']['left']}, top={snippet_info['position']['top']}")

        # Check if centered (should be roughly in the middle of 1920px viewport)
        center_x = 1920 / 2
        snippet_center = snippet_info['position']['left'] + (snippet_info['width'] / 2)
        is_centered = abs(snippet_center - center_x) < 50  # within 50px tolerance

        if is_centered:
            print(f"\n✅ Code snippet is CENTERED (snippet center: {snippet_center}, viewport center: {center_x})")
        else:
            print(f"\n⚠️  Code snippet may not be perfectly centered (snippet center: {snippet_center}, viewport center: {center_x})")

    print("\n--- Summary ---")
    print("Check /tmp/code_look.png to see the visual result")

    browser.close()
