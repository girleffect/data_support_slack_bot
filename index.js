'use strict';

const { App } = require('@slack/bolt');
require('dotenv').config();
const axios = require('axios');

// Initialize the app with your bot token and signing secret
const app = new App({
    token: process.env.SLACK_BOT_TOKEN, // Ensure your SLACK_BOT_TOKEN is correct
    signingSecret: process.env.SLACK_SIGNING_SECRET, // Ensure your SLACK_SIGNING_SECRET is correct
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN, // Ensure your SLACK_APP_TOKEN is correct
    socketModePingInterval: 10000, // Increase the ping interval to 10 seconds
    socketModePingTimeout: 10000,  // Increase the timeout to 10 seconds
});

// Event listener for when the app starts
app.event('app_home_opened', async ({ event, client }) => {
    console.log(`App Home opened by user ${event.user}`);
});

// Listen for messages
app.message(async ({ message, say }) => {
    console.log(`Message received: ${message.text}`);
    await say(`You said: ${message.text}`);
});

// Slash command for 'hello'
app.command('/hello', async ({ command, ack, say }) => {
    await ack();

    await say(`Hello, <@${command.user_id}>`);
});

// Slash command for '/dashboard'
app.command('/dashboard', async ({ command, ack, say }) => {
    await ack(); // Acknowledge the command

    try {
        console.log("Fetching dashboard data...");

        const response = await axios.get('https://api.jsonbin.io/v3/b/6752450ce41b4d34e460a52f', {
            headers: {
                'Authorization': `Bearer ${process.env.X_MASTER_KEY}`,  // Ensure the correct token is set
                'X-Master-Key': process.env.X_MASTER_KEY,  // Add the Master Key to the header
            },
        });

        // Log the API response structure for debugging
        console.log('API Response:', response.data);

        // Check if 'dashboards' exists in the response and handle if not
        if (!response.data || !response.data.dashboards) {
            throw new Error('Dashboards not found in response');
        }

        const dashboards = response.data.dashboards;
        const formattedTitles = dashboards.map((d, i) => `${i + 1}. ${d.title}`).join('\n');

        // Send the formatted message to Slack
        await say(`Here are the dashboards:\n${formattedTitles}`);
    } catch (error) {
        // Log the error in detail
        console.error('Error fetching dashboards:', error);

        // If error.response is available, log it
        if (error.response) {
            console.error('API Response Error:', error.response.data);
        }

        // Notify Slack user of the failure
        await say('Sorry, I could not fetch the dashboards. Please try again later.');
    }
});


// Start your app
(async () => {
    const port = process.env.PORT || 3000;  // Default to port 3000 if not set
    await app.start(port);
    console.log(`⚡️ Slack bot is running on port ${port}`);
})();
