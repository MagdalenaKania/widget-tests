import { expect, test} from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("https://www.tidio.com/panel/register");
  await page.evaluate(() => {
    localStorage.setItem("inboxAb", "false");
  });
  await page.reload();
});

export const getNewEmail = (): string =>
  `testing+${new Date().getTime()}@tidio.net`;

let password = (Math.random() + 1).toString(36).substring(2);

test.describe("Widget tests", () => {
  test("Send message from widget to panel and from panel to widget", async ({
    page,
  }) => {
    await test.step("Register new account", async () => {
      await page.locator('[placeholder="Email"]').fill(getNewEmail());
      await page.locator('[placeholder="Password"]').fill(password);
      await page.locator('[placeholder="Website"]').fill("example.com");
      await page.locator('[type="checkbox"]').click();
      await page.locator("button", { hasText: "Get started" }).click();
      await expect(
        page.locator("h3", { hasText: "Configure your live chat" })
      ).toBeVisible();
    });
    await test.step("Complete tour", async () => {
      const continueButton = page.locator("css=button >> text=Continue");
      await page.locator("//*[text()='Your name']/..//input").fill("user");
      await continueButton.click();
      await page
        .locator("//*[text()='Number of support agents']/..//input")
        .fill("5");
      await page.locator('//label[text()="What\'s your industry?"]/..').click();
      await page.locator('text="Online Store"').click();
      await page.locator('//label[text()="Number of customers"]/..').click();
      await page.locator('text="6-25"').click();
      await page
        .locator(
          "//*[contains(text(),'I want to have a customer service tool')]"
        )
        .click();
      await continueButton.click();
      await continueButton.click();
      await continueButton.click();
      await page.locator('text="Skip now & go to main dashboard"').click();
      await expect(page.locator("h2", { hasText: "News Feed" })).toBeVisible();
    });
    await test.step(
      "Simulate visitor and send message from widget to panel",
      async () => {
        const visitorMessage = "Message from visitor";
        const visitorEmail = "test@test.com";
        await page.locator('//a[@href="/panel/conversations"]').click();
        const [newPage] = await Promise.all([
          page.context().waitForEvent('page'),
          page.click("//*[text()='Simulate a conversation']"),
        ]);
        await newPage.waitForLoadState();
        const chatFrame = newPage.frameLocator('#tidio-chat-iframe');
        await chatFrame.locator("button[title = 'No, thanks.']").click();
        await chatFrame.locator('#new-message-textarea').fill(visitorMessage);
        await chatFrame.locator('button#button-body').click();
        await chatFrame.locator('input[type="email"]').fill(visitorEmail);
        await chatFrame.locator('//button[text()="Send"]').click();
        await page.locator('ul.visitor-list > li > a').click();
        await expect(page.locator('//div[contains(@class,"message-wrapper")]/span[text()="Message from visitor"]')).toBeVisible();
      }
    );
    await test.step("Send a reply message from the panel", async () => {
      const replyMessage = "Reply message";
      await page.locator('.css-1kfpwbs > button').click();
      await page.locator('textarea[data-test-id="new-message-textarea"]').fill(replyMessage);
      await page.locator('//button/span[text()="Reply"]/..').click();
      await expect(page.locator('//div[contains(@class,"message-wrapper")]/span[text()="Reply message"]')).toBeVisible();
    });
  });
});
