import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

const HOOKDECK_PROJECT_API_KEY = process.env.HOOKDECK_PROJECT_API_KEY;

async function getRequests() {
  try {
    const response = await fetch(
      "https://api.hookdeck.com/2024-03-01/requests?ignored_count[gte]=1",
      {
        headers: {
          Authorization: `Bearer ${HOOKDECK_PROJECT_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.models;
  } catch (error) {
    console.error("Error fetching requests:", error);
  }
}

async function getIgnoredEvents(requestId: string) {
  try {
    const response = await fetch(
      `https://api.hookdeck.com/requests/${requestId}/ignored_events`,
      {
        headers: {
          Authorization: `Bearer ${HOOKDECK_PROJECT_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.models;
  } catch (error) {
    console.error("Error ignored events:", error);
  }
}

async function retryRequest(requestId: string, connectionId: string) {
  try {
    const response = await fetch(
      `https://api.hookdeck.com/requests/${requestId}/retry`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HOOKDECK_PROJECT_API_KEY}`,
        },
        body: JSON.stringify({ webhook_ids: [connectionId] }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error triggering request retry:", error);
  }
}

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function main() {
  const requests = await getRequests();
  // console.table(requests, ["ingested_at", "source_id", "ignored_count"]);

  const ignoredEvents: {
    request_id: any;
    cause: string;
    webhook_id: string;
  }[] = [];

  // Find all ignored events with cause "TRANSFORMATION_FAILED"
  for (const request of requests) {
    const _ignoredEvents = await getIgnoredEvents(request.id);

    for (const ignoredEvent of _ignoredEvents) {
      if (ignoredEvent.cause === "TRANSFORMATION_FAILED") {
        ignoredEvents.push(ignoredEvent);
      }
    }
  }

  if (ignoredEvents.length === 0) {
    console.log("No ignored events found with cause 'TRANSFORMATION_FAILED'");
    process.exit(0);
  }

  console.log(
    `Found ${ignoredEvents.length} ignored events with cause 'TRANSFORMATION_FAILED'`
  );
  console.table(ignoredEvents, [
    "request_id",
    "cause",
    "webhook_id",
    "created_at",
  ]);

  // Retry all requests with ignored events
  for (const ignoredEvent of ignoredEvents) {
    const answer = await askQuestion(
      `Do you want to retry request ${ignoredEvent.request_id} on connection ${ignoredEvent.webhook_id}? (yes/no): `
    );
    if (answer.toLowerCase() === "yes") {
      const result = await retryRequest(
        ignoredEvent.request_id,
        ignoredEvent.webhook_id
      );

      if (result.events.length > 0) {
        console.log("Request retry triggered successfully");
      } else {
        console.log("The retry did not trigger any events.");
      }
    } else {
      console.log("Skipping request retry");
    }
  }
}

main();
