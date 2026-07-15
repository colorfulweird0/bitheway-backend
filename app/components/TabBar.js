import Link from 'next/link';

const TABS = [
  { key: 'discover', label: 'Discover', href: '/discover' },
  { key: 'matches', label: 'Matches', href: '/matches' },
  { key: 'profile', label: 'Profile', href: '/profile' }
];

export default function TabBar({ active }) {
  return (
    <div className="tabbar">
      {TABS.map((tab) => (
        <Link key={tab.key} href={tab.href} className={`tabitem ${active === tab.key ? 'active' : ''}`}>
          <span className="tabicon"></span>
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
