import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'FlowBits',
    titleTemplate: 'FlowBits — :title',
    description: 'Small bits of logic, big difference in your Flows.',
    lang: 'en-NL',
    cleanUrls: true,
    ignoreDeadLinks: true,
    lastUpdated: true,
    srcDir: 'src',
    head: [
        ['link', {rel: 'stylesheet', href: 'https://font.bmcdn.nl/css2?family=inter-variable|jetbrains-mono'}],
        ['link', {rel: 'icon', href: '/favicon.ico'}]
    ],
    rewrites(id) {
        if (id.startsWith('en/')) {
            return id.substring(3);
        }

        return id;
    },
    locales: {
        root: {
            dir: 'en',
            label: 'English',
            lang: 'en',
            themeConfig: {
                footer: {
                    copyright: 'Copyright © 2025–present <a href="https://github.com/basmilius">Bas Milius</a>',
                    message: 'Released under the <a href="https://github.com/basmilius/homey-flowbits/blob/main/LICENSE">GPL 3.0 License</a>.',
                },
                
                nav: [
                    {text: 'Home', link: '/'},
                    {text: 'Guide', link: '/guide'},
                    {text: 'Widgets', link: '/widgets'},
                    {text: 'Examples', link: '/examples'},
                    {
                        text: 'Links',
                        items: [
                            {
                                items: [
                                    {text: 'App Store', link: 'https://homey.app/a/com.basmilius.flowbits/'},
                                    {text: 'Community Topic', link: 'https://community.homey.app/t/app-pro-flowbits/145855'}
                                ]
                            },
                            {
                                text: 'More',
                                items: [
                                    {text: 'Apple TV & HomePod', link: 'https://homey.app/a/com.basmilius.apple/'},
                                    {text: 'Lists', link: 'https://homey.app/a/com.basmilius.listri/'},
                                    {text: 'SAJ R5', link: 'https://homey.app/a/com.basmilius.sajr5/'}
                                ]
                            },
                            {
                                text: 'Developer',
                                items: [
                                    {text: 'GitHub', link: 'https://github.com/basmilius'},
                                    {text: 'Website', link: 'https://bas.dev'}
                                ]
                            }
                        ]
                    }
                ],

                sidebar: {
                    '/guide/': [
                        {
                            text: 'Getting started',
                            items: [
                                {text: 'Installation', link: '/guide/'},
                                {text: 'App Settings', link: '/guide/app-settings'},
                                {text: 'Release Notes', link: '/guide/release-notes'},
                                {text: 'Philosophy', link: '/guide/philosophy'}
                            ]
                        },
                        {
                            text: 'Features',
                            items: [
                                {text: 'Events', link: '/guide/events'},
                                {text: 'Flags', link: '/guide/flags'},
                                {text: 'Labels', link: '/guide/labels'},
                                {text: 'Modes', link: '/guide/modes'},
                                {text: 'No-repeat windows', link: '/guide/no-repeat-windows'},
                                {text: 'Sets', link: '/guide/sets'},
                                {text: 'Signals', link: '/guide/signals'},
                                {text: 'Sliders', link: '/guide/sliders'},
                                {text: 'Step sequences', link: '/guide/step-sequences'},
                                {text: 'Timers', link: '/guide/timers'}
                            ]
                        },
                        {
                            items: [
                                {text: 'Miscellaneous cards', link: '/guide/miscellaneous-cards'}
                            ]
                        }
                    ],
                    '/widgets/': [
                        {
                            text: 'Widgets',
                            items: [
                                {text: 'Flag on/off', link: '/widgets/flag-onoff'},
                                {text: 'Flags', link: '/widgets/flags'},
                                {text: 'Current mode', link: '/widgets/mode-current'},
                                {text: 'Modes', link: '/widgets/modes'},
                                {text: 'Slider', link: '/widgets/slider'}
                            ]
                        }
                    ],
                    '/examples/': [
                        {
                            text: 'Examples',
                            items: [
                                {text: 'Automatic hall lighting', link: '/examples/automatic-hall-lighting'},
                                {text: 'Daypart-based modes', link: '/examples/daypart-based-modes'},
                                {text: 'Multi-scene light switch', link: '/examples/multi-scene-light-switch'}
                            ]
                        }
                    ]
                }
            }
        },
        // nl: {
        //     label: 'Nederlands',
        //     lang: 'nl',
        //     description: 'Kleine stukjes logica, groot verschil in je Flows.',
        //     themeConfig: {
        //         footer: {
        //             copyright: 'Copyright © 2025–heden <a href="https://github.com/basmilius">Bas Milius</a>',
        //             message: 'Uitgebracht onder de <a href="https://github.com/basmilius/homey-flowbits/blob/main/LICENSE">GPL 3.0 Licentie</a>.'
        //         },
        //
        //         nav: [
        //             {text: 'Home', link: '/nl/'},
        //             {text: 'Handleiding', link: '/nl/guide'},
        //             {text: 'Widgets', link: '/nl/widgets'},
        //             {text: 'Voorbeelden', link: '/nl/examples'},
        //             {
        //                 text: 'Links',
        //                 items: [
        //                     {text: 'App Store', link: 'https://homey.app/nl-nl/app/com.basmilius.flowbits/FlowBits/'},
        //                     {text: 'Community Topic', link: 'https://community.homey.app/t/app-pro-flowbits/145855'}
        //                 ]
        //             }
        //         ],
        //
        //         sidebar: {
        //             '/nl/guide/': [
        //                 {
        //                     text: 'Om te beginnen',
        //                     items: [
        //                         {text: 'Installatie', link: '/nl/guide/'},
        //                         {text: 'Filosofie', link: '/nl/guide/philosophy'}
        //                     ]
        //                 },
        //                 {
        //                     text: 'Features',
        //                     items: [
        //                         {text: 'Flags', link: '/nl/guide/flags'},
        //                         {text: 'Standen', link: '/nl/guide/modes'},
        //                         {text: 'Geen-herhalingsvensters', link: '/nl/guide/no-repeat-windows'},
        //                         {text: 'Signalen', link: '/nl/guide/signals'},
        //                         {text: 'Sliders', link: '/nl/guide/sliders'},
        //                         {text: 'Stappenreeksen', link: '/nl/guide/step-sequences'},
        //                         {text: 'Timers', link: '/nl/guide/timers'}
        //                     ]
        //                 }
        //             ],
        //             '/nl/widgets/': [
        //                 {
        //                     text: 'Widgets',
        //                     items: [
        //                         {text: 'Flag aan/uit', link: '/nl/widgets/flag-onoff'},
        //                         {text: 'Flags', link: '/nl/widgets/flags'},
        //                         {text: 'Huidige stand', link: '/nl/widgets/mode-current'},
        //                         {text: 'Standen', link: '/nl/widgets/modes'},
        //                         {text: 'Slider', link: '/nl/widgets/slider'}
        //                     ]
        //                 }
        //             ],
        //             '/nl/examples/': [
        //                 {
        //                     text: 'Voorbeelden',
        //                     items: [
        //                         {text: 'Automatische gangverlichting', link: '/nl/examples/automatic-hall-lighting'},
        //                         {text: 'Dagdeel gebaseerde standen', link: '/nl/examples/daypart-based-modes'},
        //                         {text: 'Multi-scene schakelaar', link: '/nl/examples/multi-scene-light-switch'}
        //                     ]
        //                 }
        //             ]
        //         }
        //     }
        // }
    },
    sitemap: {
        hostname: 'https://flowbits.nl'
    },
    themeConfig: {
        i18nRouting: true,
        logo: '/assets/logo.svg',

        search: {
            provider: 'local'
        },

        socialLinks: [
            {
                icon: 'github',
                link: 'https://github.com/basmilius/homey-flowbits'
            }
        ]
    }
});
