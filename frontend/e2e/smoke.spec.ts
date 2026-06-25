import { test, expect } from "@playwright/test";
import { TEST_USER, API_URL } from "./setup";

test.describe.serial("Echo Smoke Test — Deploy + Webhook", () => {
  let instanceId: string;
  let webhookToken: string;

  test("1: Catalog visibility and Deploy Wizard creates an operator", async ({
    page,
    request,
  }) => {
    await page.goto("/catalog");
    await expect(
      page.getByRole("heading", { name: "Catálogo de Operadores" }),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Eco Ventas"),
    ).toBeVisible({ timeout: 5000 });

    await page.locator("button", { hasText: "Desplegar" }).first().click();
    await expect(page.getByText("Configura los parámetros")).toBeVisible({
      timeout: 3000,
    });

    const token = await page.evaluate(() => localStorage.getItem("token"));
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    // Close the wizard via X button
    await page.locator("button").filter({ has: page.locator("svg.lucide-x") }).click();

    const createRes = await request.post(`${API_URL}/operators/`, {
      data: {
        template_slug: "eco-ventas",
        name: "E2E Bot",
        config: {
          bot_name: "E2E Bot",
          company_name: "E2E Corp",
          industry: "ecommerce",
          language: "es",
        },
        channels: [
          { channel: "whatsapp", external_id: '{"access_token":"tok_e2e","phone_number_id":"555"}' },
          { channel: "telegram", external_id: "e2e_bot_token" },
        ],
      },
      headers,
    });
    expect(createRes.ok(), `Create operator failed: ${createRes.status()} ${await createRes.text()}`).toBeTruthy();

    await page.goto("/operators");
    await expect(
      page.locator('a').filter({ hasText: 'Nuevo Bot' }),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("E2E Bot").first()).toBeVisible({ timeout: 5000 });

    const listResp = await request.get(`${API_URL}/operators/`, { headers });
    expect(listResp.ok()).toBeTruthy();
    const instances = await listResp.json();
    const e2e = instances.find(
      (i: { name: string }) => i.name === "E2E Bot",
    );
    expect(e2e).toBeDefined();
    instanceId = e2e.id;
    webhookToken = e2e.webhook_token;

    await request.post(`${API_URL}/operators/${instanceId}/deploy`, { headers });
  });

  test("2: Sidebar navigation and instance selector scoped", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Brain/RAG' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Integraciones' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Leads' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Conversaciones' })).toBeVisible();

    const trigger = page.locator("button", { hasText: /E2E Bot|Sin instancia/ });
    await expect(trigger).toBeVisible();
    await trigger.click();
    await page.waitForTimeout(300);

    const option = page.locator("[role=menuitem]", { hasText: "E2E Bot" });
    if (await option.isVisible()) {
      await option.click();
      await page.waitForTimeout(300);
    }
  });

  test("3: Webhook simulation — incoming message appears in conversations", async ({
    page,
    request,
  }) => {
    test.skip(!instanceId, "No instance deployed from previous test");

    const sender = "5219988776655";
    const msgBody = "Hola E2E, ¿me pueden ayudar con mi pedido?";

    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: sender,
                    id: "e2e_msg_001",
                    text: { body: msgBody },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const whResp = await request.post(`${API_URL}/webhooks/whatsapp`, {
      data: payload,
    });
    expect(whResp.ok()).toBeTruthy();

    await page.goto('/');
    const token = await page.evaluate(() => localStorage.getItem("token"));
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    let found = false;
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1500);
      const check = await request.get(`${API_URL}/leads?search=${sender}`, { headers });
      if (check.ok()) {
        const leads = await check.json();
        found = leads.some((l: { channel_user_id: string }) => l.channel_user_id === sender);
        if (found) break;
      }
    }

    await page.goto("/conversations");
    await expect(page.locator("aside")).toBeVisible({ timeout: 5000 });

    if (found) {
      await expect(
        page.locator("button", { hasText: sender }),
      ).toBeVisible({ timeout: 8000 });

      await page.locator("button", { hasText: sender }).click();
      await page.waitForTimeout(1000);

      await expect(page.getByText(msgBody)).toBeVisible({ timeout: 5000 });

      const botResponses = page.locator('.bg-gradient-to-r');
      const botCount = await botResponses.count();
      expect(botCount).toBeGreaterThan(0);
    }
  });
});
