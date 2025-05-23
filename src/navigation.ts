import { getPermalink, getMinistriesPermalink, getSermonsPermalink, getSeriesPermalink, getSpeakersPermalink } from './utils/permalinks';
import { fetchMinistries } from './utils/ministries';

const ministriesLinks = (await fetchMinistries()).map((ministry) => ({
  text: ministry.title,
  href: getPermalink(ministry.slug, 'ministry'),
}));

export const headerData = {
  links: [
    {
      text: 'About',
      links: [
        {
          text: 'What We Believe',
          href: getPermalink('/beliefs'),
        },
        {
          text: 'Leadership and Staff',
          href: getPermalink('/leadership-staff'),
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
          text: "By Date",
          href: getSermonsPermalink()
        },
        {
          text: "By Series",
          href: getSeriesPermalink()
        },
        {
          text: "By Speakers",
          href: getSpeakersPermalink()
        },
      ]
    },
    {
      text: 'Events',
      href: getPermalink('/events'),
    },
    {
      text: 'Give',
      href: '/give'
    },
    {
      text: 'Contact',
      href: getPermalink('/contact'),
    },
  ],
  actions: [],
  showRssFeed: false,
};

export const footerData = {
  links: [
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
          text: "By Date",
          href: getSermonsPermalink(),
        },
        {
          text: "By Series",
          href: getSeriesPermalink(),
        },
        {
          text: "By Speakers",
          href: getSpeakersPermalink(),
        },
      ]
    },
    {
      title: "Resources",
      links: [
        {
          text: 'What We Believe',
          href: getPermalink('/beliefs'),
        },
        {
          text: 'Leadership and Staff',
          href: getPermalink('/leadership-staff'),
        },
        {
          text: 'Events',
          href: getPermalink('/events'),
        },
        {
          text: 'Give',
          href: '/give'
        },
        {
          text: 'Contact',
          href: getPermalink('/contact'),
        },
      ]
    },
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
