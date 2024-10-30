import chromium from "chrome-aws-lambda";

export default async (req, res) => {
    try {
        const browser = await chromium.puppeteer.launch({
            args: [
                ...chromium.args,
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: true,
        });

        const page = await browser.newPage();
        await page.goto("https://suilend.fi/dashboard", {
            waitUntil: "networkidle2",
        });

        const data = await page.evaluate(() => {
            const rows = document.querySelectorAll("table tbody tr");
            return Array.from(rows)
                .map((row) => {
                    const cells = row.querySelectorAll("td");
                    return {
                        asset: cells[0]?.innerText,
                        apr: cells[4]?.innerText,
                    };
                })
                .filter((item) => item.apr);
        });

        await browser.close();
        res.json(data);
    } catch (error) {
        console.error("Error in Puppeteer API:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
