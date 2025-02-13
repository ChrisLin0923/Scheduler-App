import PraiseTeam from "./components/PraiseTeam/praise_team";
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CalendarService } from "./services/CalendarService";

export default function App() {
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		const initGoogleApi = async () => {
			try {
				console.log(
					"Starting Google API initialization from App component"
				);
				await CalendarService.initClient();
				setIsInitialized(true);
				console.log("Google API initialization complete");
			} catch (error) {
				console.error("Failed to initialize Google API:", error);
				// Retry initialization after a delay if it fails
				setTimeout(() => {
					if (!isInitialized) {
						initGoogleApi();
					}
				}, 2000);
			}
		};

		if (!isInitialized) {
			initGoogleApi();
		}

		return () => {
			// Cleanup if needed
		};
	}, [isInitialized]);

	return (
		<Router>
			<Routes>
				<Route path='/' element={<PraiseTeam />} />
			</Routes>
		</Router>
	);
}
