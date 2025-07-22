import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import Header from "./components/header";

export default function App() {
	return (
		<Router
			root={(props) => (
				<>
					<main class="h-[100vh] w-[100vw]">
						<Header />

						<Suspense>{props.children}</Suspense>
					</main>
				</>
			)}
		>
			<FileRoutes />
		</Router>
	);
}
