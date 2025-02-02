export default defineNuxtConfig({
	devtools: { enabled: true },
	css: ['@/assets/style/global.scss'],

	vite: {
		css: {
			preprocessorOptions: {
				scss: {
					api: 'modern-compiler',
					additionalData: '@use "~/assets/style/_variables.scss" as *;',
				},
			},
		},
	},

	modules: [
		'@pinia/nuxt',
		'@nuxtjs/i18n',
		[
			'@nuxtjs/google-fonts',
			{
				families: {
					Lato: [500, 700, 800],
					download: true,
					inject: true,
				},
			},
		],
	],
	i18n: {
		locales: [
			{
				code: 'en',
				language: 'en-US',
				file: 'en-US.ts',
			},
			{
				code: 'fr',
				language: 'fr-FR',
				file: 'fr-FR.ts',
			},
		],
		detectBrowserLanguage: {
			useCookie: true,
			cookieKey: 'i18n_redirected',
			cookieSecure: false,
		},
		strategy: 'no_prefix', // don't add language to url
	},

	components: [
		{
			path: '~/components/_UI',
			pathPrefix: false,
			prefix: 'UI',
		},
		'~/components',
	],

	compatibilityDate: '2024-11-16',
})
