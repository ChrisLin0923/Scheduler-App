import { gapi } from "gapi-script";

declare global {
	interface Window {
		gapi: typeof gapi;
		google: any;
	}
}

export interface CalendarEventDetails {
	summary: string;
	description: string;
	start: Date;
	end: Date;
	reminders?: {
		useDefault: boolean;
		overrides: Array<{
			method: "email" | "popup";
			minutes: number;
		}>;
	};
}

export class CalendarService {
	private static isInitialized = false;
	private static tokenClient: any = null;
	private static hasValidToken = false;

	static async initClient() {
		if (this.isInitialized) {
			console.log("Already initialized");
			return true;
		}

		try {
			console.log("Starting Google Calendar API initialization...");

			// Log API key and client ID
			console.log("Using API Key:", import.meta.env.VITE_GOOGLE_API_KEY);
			console.log(
				"Using Client ID:",
				import.meta.env.VITE_GOOGLE_CLIENT_ID
			);

			// Load Google Identity Services script
			await new Promise<void>((resolve, reject) => {
				const script = document.createElement("script");
				script.src = "https://accounts.google.com/gsi/client";
				script.async = true;
				script.defer = true;
				script.onload = () => resolve();
				script.onerror = (e) => reject(e);
				document.head.appendChild(script);
			});

			// Load GAPI script
			await new Promise<void>((resolve, reject) => {
				const script = document.createElement("script");
				script.src = "https://apis.google.com/js/api.js";
				script.async = true;
				script.defer = true;
				script.onload = () => resolve();
				script.onerror = (e) => reject(e);
				document.head.appendChild(script);
			});

			// Load GAPI client
			await new Promise<void>((resolve) => {
				window.gapi.load("client", resolve);
			});

			// Initialize GAPI client
			await window.gapi.client.init({
				apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
				discoveryDocs: [
					"https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
				],
			});

			console.log("GAPI client initialized");

			// Initialize token client
			this.tokenClient = window.google.accounts.oauth2.initTokenClient({
				client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
				scope: "https://www.googleapis.com/auth/calendar.events",
				callback: () => {}, // Will be overridden when requesting token
				ux_mode: "popup",
				access_type: "offline",
			});

			this.isInitialized = true;
			console.log("Initialization complete");
			return true;
		} catch (error) {
			console.error("Error initializing Google Calendar API:", error);
			throw error; // Rethrow the error for further handling
		}
	}

	static async getAccessToken(): Promise<void> {
		// If we already have a valid token, no need to request again
		if (this.hasValidToken) {
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			if (!this.tokenClient) {
				reject(new Error("Token client not initialized"));
				return;
			}

			try {
				this.tokenClient.callback = (resp: any) => {
					if (resp.error !== undefined) {
						reject(resp);
						return;
					}
					console.log("Access token obtained");
					this.hasValidToken = true;
					resolve(resp);
				};

				// Request access token
				this.tokenClient.requestAccessToken();
			} catch (err) {
				console.error("Error getting access token:", err);
				reject(err);
			}
		});
	}

	static async addEventToCalendar(eventDetails: CalendarEventDetails) {
		try {
			console.log("Starting calendar event creation...");

			// Ensure API is initialized
			if (!this.isInitialized) {
				console.log("Initializing client...");
				await this.initClient();
			}

			// Get access token only if we don't have a valid one
			if (!this.hasValidToken) {
				console.log("Requesting access token...");
				await this.getAccessToken();
			}

			const event = {
				summary: eventDetails.summary,
				description: eventDetails.description,
				start: {
					dateTime: eventDetails.start.toISOString(),
					timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				},
				end: {
					dateTime: eventDetails.end.toISOString(),
					timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				},
				reminders: eventDetails.reminders || {
					useDefault: true,
				},
			};

			console.log("Creating event:", event);

			const request = await window.gapi.client.calendar.events.insert({
				calendarId: "primary",
				resource: event,
			});

			console.log("Calendar API response:", request);

			if (request.status === 200) {
				console.log("Event created successfully:", request.result);
				return request.result;
			} else {
				this.hasValidToken = false; // Reset token state on error
				throw new Error(
					`Failed to create event. Status: ${request.status}`
				);
			}
		} catch (error) {
			console.error("Error creating calendar event:", error);
			this.hasValidToken = false; // Reset token state on error
			throw error;
		}
	}
}
