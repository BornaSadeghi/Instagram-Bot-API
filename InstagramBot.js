const puppeteer = require('puppeteer');

function randRange(min, max) {
    return min + Math.floor(Math.random()*(max+1-min))
}

class InstagramBot {

    constructor () {
        this.baseUrl = "https://instagram.com";
        this.typeDelay = 30;
        this.loadDelay = 2000;
    }

    async init (openBrowser=true) {
        // Headless mode means we don't watch the app actually launch
        this.browser = await puppeteer.launch({ headless: !openBrowser });
        this.page = await this.browser.newPage();
        
        await this.page.goto(this.baseUrl, { waitUntil: "networkidle2" });
    }

    async login (username, password) {
        await this.page.goto(this.baseUrl, { waitUntil: "networkidle2" });

        // Type in the username and password at five chars per second (to avoid being detected as a bot)
        await this.page.type('input[name="username"]', username, { delay: this.typeDelay });
        await this.page.type('input[name="password"]', password, { delay: this.typeDelay });
        
        // Click the log in button
        await this.page.click('button[type="submit"]')

        // Wait for loading to finish and then click the home button
        await this.page.waitFor(this.loadDelay + randRange(-200, 200))
        await this.page.waitFor('svg[aria-label="Home"]')
        await this.page.click('svg[aria-label="Home"]')
        
        // If the "enable notifications" popup appears, click "not now"
        await this.page.waitFor(this.loadDelay + randRange(-200, 200))
        try {
            await this.page.waitForSelector(".HoLwm")
            await this.page.click(".HoLwm")
        } catch (err) {
            console.log("Notifications popup didn't appear")
        }

        console.log(`Logged in as ${username}`)
    }

    async _goToDmsOf (recipient) {
        if (!recipient) {
            throw "_goToDms requires a recipient"
        }

        await this.page.goto(`${this.baseUrl}/direct/inbox`);

        // Wait for inbox to appear
        //await this.page.waitFor("div > div > div > div > div > div > div > div > div > div > div");

        // Click the "send message" button
        await this.page.$x('//button[contains(text(), "Send Message")]')
        .then(elements => elements[0].click());

        // Search the recipient's name
        await this.page.type("input[name=queryBox]", recipient, { delay: this.typeDelay });
        
        await this.page.waitFor(this.loadDelay + randRange(-200, 200))

        
        // Click on recipient
        await this.page.$x(`//div[text()="${recipient}"]`)
        .then(elements => elements[elements.length-1].click())
        .catch(err => console.error(`User does not exist (${err})`))

        await this.page.waitFor(this.loadDelay + randRange(-200, 200))

        // Click on the next button
        await this.page.click(".rIacr")
    }

    // Will need to be updated when I am able to view posts
    async dm (recipient, message) {
        // make sure the dms of the recipient are loaded
        
        try {
            // Ensure we're in the dms. Will time out and go to catch if not
            await this.page.waitFor("textarea[placeholder='Message...']", { timeout: this.loadDelay + randRange(-200, 200)})

            // Ensure we're in the right person's dms
            await this.page.$x(`//div[text()="${recipient}"]`)
            .then(elements => {
                // The person's name should appear twice if we are messaging them
                if (elements.length < 2) {
                    throw "go to dms"
                }
            })

            
        } catch (err) {
            console.error(err)
            await this._goToDmsOf(recipient)
        }

        // Ensure that the message area has loaded
        await this.page.waitFor("textarea[placeholder='Message...']")

        // Type into the message area
        await this.page.type("textarea[placeholder='Message...']", message, { delay: this.typeDelay })

        // Press send button
        await this.page.$x('//button[text()="Send"]')
        .then(button => button[0].click())

        console.log(`Sent message "${message}" to ${recipient}`)
    }

    // Go into the dms and respond to the most recent message
    async getUnread () {
        try {
            // Go to the dms endpoint
            await this.page.goto(`${this.baseUrl}/direct/inbox/`)

            // Wait for an unread message (look for bolded names)
            await this.page.waitFor("div.qyrsm", { timeout: this.loadDelay + randRange(-200, 200) })

            // Click on the unread DM
            await this.page.click("div.qyrsm")

            let message = (await this.page.$$(".g6RW6")
            .then(messages => {
                messages[0].click()
                messages[0].click()
            }))

            // Like most recent message
            //await this.page.click(message)
            //await this.page.click(message)
        } catch (err) {
            console.error(err)
            console.log("No unread DMs.")
        }

    }
}

module.exports = InstagramBot;