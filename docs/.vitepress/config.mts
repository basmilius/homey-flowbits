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
        }
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
