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

    await say(`Hello, <@${command.user_id}>, how can I assist you today? Here are some commands you can use:\n` +
        `- For help with dashboards, type \`/dashboards\`\n` +
        `- For help with data sources, type \`/data_sources\`\n` +
        `- For something else, type \`/adhoc\``);
});

// Slash command for '/dashboards'
app.command('/dashboards', async ({ command, ack, say }) => {
    await ack(); // Acknowledge the command immediately

    try {
        console.log("Fetching dashboard data...");

        // Update the URL to point to the raw GitHub JSON file
        const response = await axios.get('https://raw.githubusercontent.com/girleffect/data_dada/main/dashboard.json');

        // Log the API response structure for debugging
        console.log('API Response:', JSON.stringify(response.data, null, 2)); // Improved logging

        // Check if 'dashboards' exists in the response and handle if not
        if (!response.data || !response.data.dashboards) {
            throw new Error('Dashboards not found in response');
        }

        const dashboards = response.data.dashboards;
        const formattedTitles = dashboards.map((d, i) => `${i + 1}. <${d.url}|${d.title}> ${d.description}`).join('\n');

        // Send the formatted message to Slack
        await say(`Here is the list of available dashboards:\n${formattedTitles}`);
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


// Slash command for '/data_sources'
app.command('/data_sources', async ({ command, ack, say }) => {
    await ack(); // Acknowledge the command immediately

    try {
        console.log("Fetching data sources data...");

        // Update the URL to point to the raw GitHub JSON file
        const response = await axios.get('https://raw.githubusercontent.com/girleffect/data_dada/main/data_sources.json');

        // Log the API response structure for debugging
        console.log('API Response:', JSON.stringify(response.data, null, 2)); // Improved logging

        // Check if 'dashboards' exists in the response and handle if not
        if (!response.data || !response.data.data_sources) {
            throw new Error('Data Sources not found in response');
        }


        // Send the formatted message to Slack
        await say(`Here is the list of current data sources:\n${formattedTitles}`);
    } catch (error) {
        // Log the error in detail
        console.error('Error fetching data sources:', error);

        // If error.response is available, log it
        if (error.response) {
            console.error('API Response Error:', error.response.data);
        }

        // Notify Slack user of the failure
        await say('Sorry, I could not fetch the data sources. Please try again later.');
    }
});

// Start your app
(async () => {
    const port = process.env.PORT || 3000;  // Default to port 3000 if not set
    await app.start(port);
    console.log(`⚡️ Slack bot is running on port ${port}`);
})();
