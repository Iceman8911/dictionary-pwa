import InfoIcon from "lucide-solid/icons/info";

/** Simple info icon that can be hovered over to display extra information */
export default function Tooltip(prop: {
	/** Information that will be displayed in the popup on hover */
	info: string;
	/** Applies to the svg icon that displays the popup on hover */
	class?: string;
	/** Direction that the popup should follow */
	dir?: "up" | "down" | "right" | "left";
}) {
	const directions = {
		up: "tooltip-up",
		down: "tooltip-down",
		right: "tooltip-right",
		left: "tooltip-left",
	} as const;

	return (
		<span
			class={`tooltip ${prop.dir ? directions[prop.dir] : ""}`}
			data-tip={prop.info}
		>
			<InfoIcon class={prop.class} />
		</span>
	);
}
