"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";

const navigation = [
  {
    name: "Home",
    href: "/",
    icon: "🏠",
    activeIcon: "🏠",
  },
  {
    name: "Account",
    href: "/account",
    icon: "👤",
    activeIcon: "👤",
  },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const { isConnected } = useWallet();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/" &&
              (pathname === "/landing" || pathname === "/"));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors min-w-0 ${
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl mb-1">
                {isActive ? item.activeIcon : item.icon}
              </span>
              <span className="text-xs font-medium">{item.name}</span>

              {/* Connection indicator for Account tab */}
              {item.name === "Account" && isConnected && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default BottomNavigation;
