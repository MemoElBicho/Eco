# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend\e2e\smoke.spec.ts >> Eco Smoke Test — Deploy + Webhook >> 2: Sidebar navigation and instance selector scoped
- Location: frontend\e2e\smoke.spec.ts:89:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { TEST_USER, API_URL } from "./setup";
  3   | 
  4   | test.describe("Eco Smoke Test — Deploy + Webhook", () => {
  5   |   let instanceId: string;
  6   |   let webhookToken: string;
  7   | 
  8   |   test("1: Catalog visibility and Deploy Wizard creates an operator", async ({
  9   |     page,
  10  |     request,
  11  |   }) => {
  12  |     // Navigate to catalog
  13  |     await page.goto("/catalog");
  14  |     await expect(
  15  |       page.getByRole("heading", { name: "Catálogo de Operadores" }),
  16  |     ).toBeVisible({ timeout: 10000 });
  17  |     await expect(
  18  |       page.getByText("Eco Ventas"),
  19  |     ).toBeVisible({ timeout: 5000 });
  20  | 
  21  |     // Open deploy wizard for eco-ventas
  22  |     await page.locator("button", { hasText: "Desplegar" }).first().click();
  23  |     await expect(page.getByText("Configura los parámetros")).toBeVisible({
  24  |       timeout: 3000,
  25  |     });
  26  | 
  27  |     // Step 1: basic config
  28  |     await page.getByLabel("Nombre del Bot").fill("E2E Bot");
  29  |     await page.getByLabel("Nombre de la Empresa").fill("E2E Corp");
  30  |     await page.getByLabel("Idioma").fill("es");
  31  |     await page
  32  |       .getByRole("button", { name: "Siguiente" })
  33  |       .first()
  34  |       .click();
  35  | 
  36  |     // Step 2: channels (WhatsApp + Telegram are checked by default)
  37  |     await expect(page.getByText("WhatsApp")).toBeVisible({ timeout: 3000 });
  38  |     const waInput = page
  39  |       .locator('input[placeholder*="access_token"]')
  40  |       .first();
  41  |     if (await waInput.isVisible()) {
  42  |       await waInput.fill(
  43  |         '{"access_token":"tok_e2e","phone_number_id":"555"}',
  44  |       );
  45  |     }
  46  |     const tgInput = page.locator('input[placeholder*="Bot Token"]').first();
  47  |     if (await tgInput.isVisible()) {
  48  |       await tgInput.fill("e2e_bot_token");
  49  |     }
  50  |     await page
  51  |       .getByRole("button", { name: "Siguiente" })
  52  |       .first()
  53  |       .click();
  54  | 
  55  |     // Step 3: confirm and deploy
  56  |     await expect(page.getByText("Confirmar despliegue")).toBeVisible({
  57  |       timeout: 3000,
  58  |     });
  59  |     await expect(page.getByText("E2E Bot")).toBeVisible();
  60  |     await page
  61  |       .getByRole("button", { name: "Lanzar Instancia" })
  62  |       .click();
  63  | 
  64  |     // Wait for dialog to close + redirect
  65  |     await page.waitForTimeout(1000);
  66  | 
  67  |     // Navigate to operators list and verify the new bot appears
  68  |     await page.goto("/operators");
  69  |     await expect(
  70  |       page.getByRole("heading", { name: "Mis Bots" }),
  71  |     ).toBeVisible({ timeout: 10000 });
  72  |     await expect(page.getByText("E2E Bot")).toBeVisible({ timeout: 5000 });
  73  | 
  74  |     // Fetch instance ID via API for later webhook test
  75  |     const listResp = await request.get(`${API_URL}/operators/`);
  76  |     expect(listResp.ok()).toBeTruthy();
  77  |     const instances = await listResp.json();
  78  |     const e2e = instances.find(
  79  |       (i: { name: string }) => i.name === "E2E Bot",
  80  |     );
  81  |     expect(e2e).toBeDefined();
  82  |     instanceId = e2e.id;
  83  |     webhookToken = e2e.webhook_token;
  84  | 
  85  |     // Activate the instance via API
  86  |     await request.post(`${API_URL}/operators/${instanceId}/deploy`);
  87  |   });
  88  | 
  89  |   test("2: Sidebar navigation and instance selector scoped", async ({
  90  |     page,
  91  |   }) => {
> 92  |     await page.goto("/");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  93  |     await page.waitForTimeout(500);
  94  | 
  95  |     // Sidebar is visible
  96  |     const sidebar = page.locator('[data-slot="sidebar"]');
  97  |     await expect(sidebar).toBeVisible({ timeout: 5000 });
  98  | 
  99  |     // Verify nav items
  100 |     await expect(page.getByText("Dashboard")).toBeVisible();
  101 |     await expect(page.getByText("Catálogo")).toBeVisible();
  102 |     await expect(page.getByText("Mis Bots")).toBeVisible();
  103 |     await expect(page.getByText("Leads")).toBeVisible();
  104 |     await expect(page.getByText("Conversaciones")).toBeVisible();
  105 | 
  106 |     // Instance selector dropdown exists
  107 |     const trigger = page.locator("button", { hasText: /E2E Bot|Sin instancia/ });
  108 |     await expect(trigger).toBeVisible();
  109 |     await trigger.click();
  110 |     await page.waitForTimeout(300);
  111 | 
  112 |     // Select the E2E Bot instance if present
  113 |     const option = page.locator("[role=menuitem]", { hasText: "E2E Bot" });
  114 |     if (await option.isVisible()) {
  115 |       await option.click();
  116 |       await page.waitForTimeout(300);
  117 |     }
  118 |   });
  119 | 
  120 |   test("3: Webhook simulation — incoming message appears in conversations", async ({
  121 |     page,
  122 |     request,
  123 |   }) => {
  124 |     test.skip(!instanceId, "No instance deployed from previous test");
  125 | 
  126 |     const sender = "5219988776655";
  127 |     const msgBody = "Hola E2E, ¿me pueden ayudar con mi pedido?";
  128 | 
  129 |     // POST to the legacy whatsapp webhook (finds first active instance)
  130 |     const payload = {
  131 |       entry: [
  132 |         {
  133 |           changes: [
  134 |             {
  135 |               value: {
  136 |                 messages: [
  137 |                   {
  138 |                     from: sender,
  139 |                     id: "e2e_msg_001",
  140 |                     text: { body: msgBody },
  141 |                   },
  142 |                 ],
  143 |               },
  144 |             },
  145 |           ],
  146 |         },
  147 |       ],
  148 |     };
  149 |     const whResp = await request.post(`${API_URL}/webhooks/whatsapp`, {
  150 |       data: payload,
  151 |     });
  152 |     expect(whResp.ok()).toBeTruthy();
  153 | 
  154 |     // Allow async Celery + AI processing
  155 |     await page.waitForTimeout(3000);
  156 | 
  157 |     // Navigate to conversations and verify the new message
  158 |     await page.goto("/conversations");
  159 |     await expect(
  160 |       page.getByRole("heading", { name: "Conversaciones" }),
  161 |     ).toBeVisible({ timeout: 10000 });
  162 | 
  163 |     // The new lead should appear in the sidebar list
  164 |     await expect(
  165 |       page.locator("button", { hasText: sender }),
  166 |     ).toBeVisible({ timeout: 8000 });
  167 | 
  168 |     // Click the conversation
  169 |     await page.locator("button", { hasText: sender }).click();
  170 |     await page.waitForTimeout(1000);
  171 | 
  172 |     // Verify the inbound message is displayed
  173 |     await expect(page.getByText(msgBody)).toBeVisible({ timeout: 5000 });
  174 | 
  175 |     // The eco_bot should have responded
  176 |     const botResponses = page.locator('[data-direction="out"], .bg-primary');
  177 |     const botCount = await botResponses.count();
  178 |     expect(botCount).toBeGreaterThan(0);
  179 |   });
  180 | });
  181 | 
```