import { useNavigate } from "@solidjs/router";

export default function NotFound() {
	// Route back to the index page
	useNavigate()("/");

	return "";
}
