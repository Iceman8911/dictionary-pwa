/** When active, takes up all the space of it's parent whilist being "on-top" of it's sibling elements */
export default function LoadingSpinner() {
	return (
		<div class="absolute top-0 left-0 z-50 size-full flex justify-center items-center backdrop-blur brightness-90">
			<span class="loading loading-spinner loading-xl"></span>
		</div>
	);
}
