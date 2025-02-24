'use strict';

const { App } = require('@slack/bolt');
require('dotenv').config();
const axios = require('axios');

// Validate required environment variables
const requiredEnvVars = ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', 'SLACK_APP_TOKEN'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

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

// Command to greet the user and display initial options
app.command('/hi', async ({ command, ack, say }) => {
    await ack();

    await say(
        {
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `Hi, <@${command.user_id}>, welcome to the Data Support, I am Data Dada. Are you trying to do any of the following?`
                    }
                },
                {
                    type: "actions",
                    elements: [
                        {
                            type: "button",
                            text: {
                                type: "plain_text",
                                text: "Find a Dashboard"
                            },
                            value: "dashboards",
                            action_id: "find_dashboard"
                        },
                        {
                            type: "button",
                            text: {
                                type: "plain_text",
                                text: "Find a Data Source"
                            },
                            "value": "data_sources",
                            "url": "https://www.notion.so/gedigitalteam/1380818435d580fd9edbec159455f77e?v=1380818435d580a38138000ca3b3a413&pvs=4"
                        }
                    ]
                },
                {
                    "type": "divider"
                }
            ]
        });
});


// Action handler for "No, I need help" after "Find a Dashboard"
app.action('need_help_dashboard', async ({ ack, body, client }) => {
    await ack();

    const channelId = body.channel.id;

    await client.chat.postMessage({
        channel: channelId,
        text: "It seems you didn't find what you were looking for. Please check our FAQs here:",
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `It seems you didn't find what you were looking for. Please check our FAQs here:`
                }
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Go to FAQs"
                        },
                        url: "https://www.notion.so/gedigitalteam/FAQs-13e0818435d580acb5eccdb0a5e26062",
                        action_id: "go_to_faqs"
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "What I need is.."
                        },
                        action_id: "help_button"
                    },
                ]
            }
        ]
    });
});

// Action handler for "Found what I was looking for!" (Optional confirmation message)
app.action('got_it', async ({ ack, body, client }) => {
    await ack();

    console.log('Action received:', body); // Log the incoming body
    const channelId = body.channel.id;
    const userId = body.user.id;
    const messageText = `That's awesome, <@${userId}>! :tada: I'm glad I could help. Let me know if you need anything else. :blush:.`;

    await client.chat.postMessage({
        channel: channelId,
        text: messageText
    });

});


// Slash command for '/dashboards'
app.command('/dashboards', async ({ command, ack, say }) => {
    await ack(); // Acknowledge the command immediately
    await fetchAndSendDashboards(command.user_id, say);
});

// Action handler for 'Find a Dashboard' button
app.action('find_dashboard', async ({ ack, body, client }) => {
    await ack(); // Acknowledge the button click

    const userId = body.user.id; // Get the user ID of the button clicker
    const channelId = body.channel.id; // Get the channel ID where the button was clicked

    try {
        // Fetch and send dashboards using a helper function
        await dashboardsMessage(userId, async (message) => {
            await client.chat.postMessage({
                channel: channelId,
                text: message,
            });
        });
    } catch (error) {
        console.error('Error in button action:', error);
    }
});

// Helper function to fetch and send dashboards
async function dashboardsMessage(userId, say) {
    try {
        console.log("Fetching dashboard data...");

        // Fetch data from the GitHub JSON file
        const response = await axios.get('https://raw.githubusercontent.com/girleffect/data_dada/main/dashboard.json');

        console.log('API Response:', JSON.stringify(response.data, null, 2)); // Log response for debugging

        // Check if 'dashboards' exists in the response
        if (!response.data || !response.data.dashboards) {
            throw new Error('Dashboards not found in response');
        }

        const dashboards = response.data.dashboards;
        const formattedTitles = dashboards
            .map((d, i) => `${i + 1}.<${d.url}|${d.title}> ${d.description}`)
            .join('\n');

        // Send the formatted message
        await say(`Here <@${userId}> is the list of currently available dashboards: \n${formattedTitles}`);
    } catch (error) {
        console.error('Error fetching dashboards:', error);

        if (error.response) {
            console.error('API Response Error:', error.response.data);
        }

        // Notify Slack user of the failure
        await say('Sorry, I could not fetch the dashboards at the moment. Please try again later.');
    }
}



// Slash command for '/help'
app.command('/help', async ({ command, ack, say }) => {
    await ack();

    try {
        const googleSheetFormURL = 'https://docs.google.com/spreadsheets/d/1lxyqzwE6HoJlDt-LH8qTt0GcaShnbDOSFyFGJcz8lGM/edit?usp=sharing'; // Replace with your actual form link

        await say(`Hi <@${command.user_id}>! Please fill out the request form here: <${googleSheetFormURL}|Click here to submit your request>.`);
    } catch (error) {
        console.error('Error sending form link:', error.message, error.stack);
    }
});


app.command('/help', async ({ command, ack, say }) => {
    await ack();

    try {
        const googleSheetFormURL = 'https://docs.google.com/spreadsheets/d/1lxyqzwE6HoJlDt-LH8qTt0GcaShnbDOSFyFGJcz8lGM/edit?usp=sharing'; // Replace with your actual form link

        await say({
            text: `Hi <@${command.user_id}>! Please fill out the request form using the button below.`,
            attachments: [
                {
                    text: "Submit your request",
                    fallback: "Click the button to submit your request",
                    actions: [
                        {
                            type: "button",
                            text: "Submit Request",
                            url: googleSheetFormURL,
                            style: "primary"
                        }
                    ]
                }
            ]
        });
    } catch (error) {
        console.error('Error sending form link:', error.message, error.stack);
    }
});



// Utility function for error handling
function logError(error, context = '') {
    console.error(`❌ Error${context ? ` in ${context}` : ''}:`, error.message || error);
    if (error.stack) {
        console.error('Stack trace:', error.stack);
    }
}

// Start your app
(async () => {
    try {
        const port = process.env.PORT || 3000;
        await app.start(port);
        console.log(`⚡️ Slack bot is running on port ${port}`);
    } catch (error) {
        logError(error, 'app startup');
        process.exit(1);
    }
})();
