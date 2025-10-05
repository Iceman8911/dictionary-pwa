import { useNavigate } from "@solidjs/router";
import { onMount } from "solid-js";

export default function NotFound() {
	const navigate = useNavigate();

	onMount(() => {
		// Navigate back to home page after component mounts
		navigate("/", { replace: true });
	});

	// Show nothing since we're redirecting
	return null;
}
