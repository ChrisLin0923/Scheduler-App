import PraiseTeam from "./components/PraiseTeam/praise_team";
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
	return (
		<Router>
			<Routes>
				<Route path='/' element={<PraiseTeam />} />
			</Routes>
		</Router>
	);
}

export default App;
