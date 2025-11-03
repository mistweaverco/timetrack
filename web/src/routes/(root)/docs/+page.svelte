<script lang="ts">
	import HeadComponent from '$lib/HeadComponent.svelte';
</script>

<HeadComponent
	data={{
		title: 'Timetrack',
		description:
			'Simple, offline-first, privacy-focused, desktop application to track your time spent on different projects.'
	}}
/>

<div id="start" class="hero bg-base-200 min-h-screen">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<img src="/logo.svg" alt="Timetrack logo" class="m-5 mx-auto w-64" />
			<h1 class="text-5xl font-bold">Timetrack</h1>
			<p class="py-6">
				Documentation for Timetrack, a simple, offline-first, privacy-focused, desktop application
				to track your time spent on different projects.
			</p>
			<p>Coming soon...</p>
		</div>
	</div>
</div>
