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

// Action handler for "Find a Dashboard"
app.action('find_dashboard', async ({ ack, body, client }) => {
    await ack();

    const userId = body.user.id;
    const channelId = body.channel.id; // Get the actual channel ID

    // Define your dashboards message here
    const dashboardsMessage = "Here is the dashboard message"; // Replace with the actual message content

    await client.chat.postMessage({
        channel: channelId, // Use the actual channelId variable here
        text: dashboardsMessage, // Use the dashboardsMessage variable here
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: dashboardsMessage
                }
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Found what I was looking for it!"
                        },
                        value: "found_dashboard",
                        action_id: "find_dashboard"
                    },
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "No, I still need help."
                        },
                        value: "need_help_dashboard",
                        action_id: "need_help_dashboard"
                    }
                ]
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
        text: "It seems you didn't find what you were looking for. Please check our FAQs here: https://www.notion.so/gedigitalteam/FAQs-13e0818435d580acb5eccdb0a5e26062"
    });
});

// Action handler for "Yes, I found it!" (Optional confirmation message)
app.action('found_dashboard', async ({ ack, body, client }) => {
    await ack();

    const channelId = body.channel.id;

    await client.chat.postMessage({
        channel: channelId,
        text: "Great to hear! Let me know if you need anything else."
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
app.command('/help', async ({ command, ack, client, say }) => {
    await ack();

    try {
        // Inform the user to fill out the form
        await say(`Hi < @${command.user_id} > !Please fill out the form below to submit your request.`);

        // Open the modal
        await client.views.open({
            trigger_id: command.trigger_id,
            view: {
                type: 'modal',
                callback_id: 'data_platform_request_form', // Ensure this matches the handler
                title: {
                    type: 'plain_text',
                    text: 'Data Platform Request'
                },
                blocks: [
                    {
                        type: 'input',
                        block_id: 'name_input',
                        element: {
                            type: 'plain_text_input',
                            action_id: 'name'
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Name'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'role_input',
                        element: {
                            type: 'plain_text_input',
                            action_id: 'role'
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Role'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'request_type_input',
                        element: {
                            type: 'static_select',
                            action_id: 'request_type',
                            options: [
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Dashboard (One-Off)'
                                    },
                                    value: 'one_off'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Data Source (Required Regularly)'
                                    },
                                    value: 'required_regularly'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Other'
                                    },
                                    value: 'existing_info'
                                }
                            ]
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Request Type'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'geo_specific_input',
                        optional: false,
                        element: {
                            type: 'static_select', // Changed to static_select for single choice
                            action_id: 'geo_specific',
                            options: [
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'India'
                                    },
                                    value: 'india'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'South Africa'
                                    },
                                    value: 'south_africa'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Kenya'
                                    },
                                    value: 'kenya'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Tanzania'
                                    },
                                    value: 'tanzania'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Nigeria'
                                    },
                                    value: 'nigeria'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Ethiopia'
                                    },
                                    value: 'ethiopia'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Global'
                                    },
                                    value: 'global'
                                }
                            ]
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Is this geo-specific?'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'description_input',
                        element: {
                            type: 'plain_text_input',
                            multiline: true,
                            action_id: 'description'
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Description (Required)'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'priority_input',
                        element: {
                            type: 'static_select',
                            action_id: 'priority',
                            options: [
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'High'
                                    },
                                    value: 'high'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Medium'
                                    },
                                    value: 'medium'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Low'
                                    },
                                    value: 'low'
                                }
                            ]
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Priority Level'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'completion_date_input',
                        element: {
                            type: 'datepicker',
                            action_id: 'completion_date',
                            placeholder: {
                                type: 'plain_text',
                                text: 'Select a date'
                            }
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Desired Completion Date'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'dashboard_or_datasource_input',
                        element: {
                            type: 'static_select',
                            action_id: 'dashboard_or_datasource',
                            options: [
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Linked to existing dashboard'
                                    },
                                    value: 'existing_dashboard'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'New dashboard'
                                    },
                                    value: 'new_dashboard'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'Linked to existing data source'
                                    },
                                    value: 'existing_datasource'
                                },
                                {
                                    text: {
                                        type: 'plain_text',
                                        text: 'New data source'
                                    },
                                    value: 'new_datasource'
                                }
                            ]
                        },
                        label: {
                            type: 'plain_text',
                            text: 'Is this request linked to an existing or new dashboard/data source?'
                        }
                    },
                    {
                        type: 'input',
                        block_id: 'other_description_input',
                        optional: true,
                        element: {
                            type: 'plain_text_input',
                            multiline: true,
                            action_id: 'other_description',
                            placeholder: {
                                type: 'plain_text',
                                text: 'Please explain what this request is for.'
                            }
                        },
                        label: {
                            type: 'plain_text',
                            text: 'If it is other (Please explain)'
                        }
                    }
                ],
                submit: {
                    type: 'plain_text',
                    text: 'Submit'
                }
            }
        });
    } catch (error) {
        console.error('Error opening modal:', error.message, error.stack);
    }
});

// Handle form submission
app.view('data_platform_request_form', async ({ ack, body, view, client }) => {
    await ack();

    const user = body.user.id;
    const name = view.state.values.name_input.name.value;
    const role = view.state.values.role_input.role.value;
    const requestType = view.state.values.request_type_input.request_type.selected_option.value;
    const geoSpecific = view.state.values.geo_specific_input.geo_specific.selected_option.value; // Updated to single choice
    const description = view.state.values.description_input.description.value;
    const priority = view.state.values.priority_input.priority.selected_option.value;
    const completionDate = view.state.values.completion_date_input.completion_date.selected_date;

    // Get additional details for request type (linked to existing or new)
    let requestDetails = '';
    if (requestType === 'one_off') {
        const linkedToExisting = view.state.values.dashboard_or_datasource_input.dashboard_or_datasource.selected_option.value;
        requestDetails = `Request is linked to an existing dashboard: ${linkedToExisting}`;
    } else if (requestType === 'required_regularly') {
        const linkedToExisting = view.state.values.dashboard_or_datasource_input.dashboard_or_datasource.selected_option.value;
        requestDetails = `Request is linked to an existing data source: ${linkedToExisting}`;
    } else if (requestType === 'existing_info') {
        requestDetails = `Additional explanation: ${view.state.values.other_description_input.other_description.value}`;
    }

    console.log(`Request submitted by ${user}:`, {
        name,
        role,
        requestType,
        geoSpecific,
        description,
        priority,
        completionDate
    });

    try {
        const plainText = `Your request details are as follows:
            Name: ${name}
        Role: ${role}
    Request Type: ${requestType}
    Request Details: ${requestDetails}
        Geo - Specific: ${geoSpecific}
        Description: ${description}
        Priority: ${priority}
    Desired Completion Date: ${completionDate}
    
    Thank you, @${user}, someone from the Data team will be in touch shortly to follow up on your request.`;

        await client.chat.postMessage({
            channel: 'C02Q5LEG9MK',  // Ensure 'user' is the correct channel ID or user ID
            text: plainText, // Plain-text fallback for assistive technologies
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `Your request details are as follows: \n\n*Name: * ${name}\n * Role:* ${role}\n * Request Type:* ${requestType}\n${requestDetails}\n * Geo - Specific:* ${geoSpecific}\n * Description:* ${description}\n * Priority:* ${priority}\n * Desired Completion Date:* ${completionDate}\n\n_Thank you, < @${user} >, someone from the Data team will be in touch shortly to follow up on your request._`
                    }
                }
            ]
        });
    } catch (error) {
        console.error('Error sending confirmation message:', error.message, error.stack);
    }

});



// Start your app
(async () => {
    const port = process.env.PORT || 3000;  // Default to port 3000 if not set
    await app.start(port);
    console.log(`⚡️ Slack bot is running on port ${port}`);
})();
