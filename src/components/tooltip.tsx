import InfoIcon from "lucide-solid/icons/info";
import type { JSXElement } from "solid-js";

/** Simple info icon that can be hovered over to display extra information */
export default function Tooltip(prop: {
	/** Information that will be displayed in the popup on hover */
	info: JSXElement;
	/** Applies to the svg icon that displays the popup on hover */
	class?: string;
	/** Direction that the popup should follow */
	dir?: "up" | "down" | "right" | "left";
}) {
	const directions = {
		down: "tooltip-down",
		left: "tooltip-left",
		right: "tooltip-right",
		up: "tooltip-up",
	} as const;

	return (
		<div class={`tooltip ${prop.dir ? directions[prop.dir] : ""}`}>
			<div class="tooltip-content">{prop.info}</div>

			<InfoIcon class={prop.class} />
		</div>
	);
}
