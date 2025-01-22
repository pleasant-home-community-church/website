import { getPermalink, getMinistriesPermalink, getSermonsPermalink, getSeriesPermalink, getSpeakersPermalink } from './utils/permalinks';
import { fetchMinistries } from './utils/ministries';

const ministriesLinks = (await fetchMinistries()).map((ministry) => ({
  text: ministry.title,
  href: getPermalink(ministry.slug, 'ministry'),
}));

export const headerData = {
  links: [
    {
      text: 'Home',
      href: '/',
    },
    {
      text: 'About',
      links: [
        {
          text: 'What We Believe',
          href: getPermalink('/beliefs'),
        },
        {
          text: 'Leadership and Staff',
          href: getPermalink('/leadership'),
        },
      ],
    },
    {
      text: 'Ministries',
      href: getMinistriesPermalink(),
      links: ministriesLinks,
    },
    {
      text: 'Sermons',
      href: getSermonsPermalink(),
      links: [
        {
          text: "Series",
          href: getSeriesPermalink()
        },
        {
          text: "Speakers",
          href: getSpeakersPermalink()
        },
      ]
    },
  ],
  actions: [],
  showRssFeed: false,
};

export const footerData = {
  links: [
    {
      title: 'About',
      links: [
        {
          text: 'What We Believe',
          href: getPermalink('/beliefs'),
        },
        {
          text: 'Leadership and Staff',
          href: getPermalink('/leadership'),
        },
      ],
    },
    {
      title: 'Ministries',
      href: getMinistriesPermalink(),
      links: ministriesLinks,
    },
    {
      title: 'Sermons',
      href: getSermonsPermalink(),
      links: [
        {
          text: "Series",
          href: getSeriesPermalink(),
        },
        {
          text: "Speakers",
          href: getSpeakersPermalink(),
        },
      ]
    },
    // {
    //   title: 'Support',
    //   links: [
    //     { text: 'Docs', href: '#' },
    //     { text: 'Community Forum', href: '#' },
    //     { text: 'Professional Services', href: '#' },
    //     { text: 'Skills', href: '#' },
    //     { text: 'Status', href: '#' },
    //   ],
    // },
    // {
    //   title: 'Company',
    //   links: [
    //     { text: 'About', href: '#' },
    //     { text: 'Ministries', href: '#' },
    //     { text: 'Careers', href: '#' },
    //     { text: 'Press', href: '#' },
    //     { text: 'Inclusion', href: '#' },
    //     { text: 'Social Impact', href: '#' },
    //     { text: 'Shop', href: '#' },
    //   ],
    // },
  ],
  secondaryLinks: [
    // { text: 'Terms', href: getPermalink('/terms') },
    // { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'SermonAudio', icon: 'tabler:device-tv', href: 'https://www.sermonaudio.com/broadcasters/phcc/' },
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: 'https://www.instagram.com/rooted.phcc/' },
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: 'https://www.facebook.com/Pleasant-Home-Community-Church-308366072618357' },
  ],
  footNote: '',
};
