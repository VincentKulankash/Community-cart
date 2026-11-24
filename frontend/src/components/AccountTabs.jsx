import { HandCoins, LayoutList, MessageCircle } from "lucide-react";

const TABS = [
  { path: "/my-listings", label: "My listings", Icon: LayoutList },
  { path: "/my-offers", label: "My offers", Icon: HandCoins },
  { path: "/messages", label: "Messages", Icon: MessageCircle },
];

/*
 * Switcher shown at the top of the three "your account" pages:
 * what you sell, what you have offered on, and your conversations.
 */
function AccountTabs({ current, onNavigate }) {
  return (
    <nav className="account-tabs" aria-label="Your account">
      {TABS.map(({ path, label, Icon }) => (
        <a
          key={path}
          href={path}
          className={current === path ? "account-tab active" : "account-tab"}
          aria-current={current === path ? "page" : undefined}
          onClick={(event) => {
            event.preventDefault();
            if (current !== path) onNavigate(path);
          }}
        >
          <Icon size={17} aria-hidden="true" />
          {label}
        </a>
      ))}
    </nav>
  );
}

export default AccountTabs;