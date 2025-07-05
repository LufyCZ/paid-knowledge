"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { ClientOnly } from "./ClientOnly";
import { FaGlobe } from "react-icons/fa";
import { RiAccountCircleLine } from "react-icons/ri";

const navigation = [
  {
    name: "Home",
    href: "/",
    Icon: FaGlobe,
  },
  {
    name: "Account",
    href: "/account",
    Icon: RiAccountCircleLine,
  },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const { isConnected } = useWallet();

  return (
    <ClientOnly
      fallback={
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
          <div className="flex justify-center items-center space-x-16 max-w-md mx-auto">
            <div className="flex items-center justify-center w-8 h-8">
              <FaGlobe className="w-6 h-6 text-black" />
            </div>
            <div className="flex items-center justify-center w-8 h-8">
              <RiAccountCircleLine className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      }
    >
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
        <div className="flex justify-center items-center space-x-16 max-w-md mx-auto">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/" &&
                (pathname === "/landing" || pathname === "/"));

            const IconComponent = item.Icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center justify-center w-8 h-8 transition-opacity hover:opacity-80"
              >
                <IconComponent
                  className={`w-6 h-6 ${
                    isActive ? "text-black" : "text-gray-600"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </ClientOnly>
  );
}

export default BottomNavigation;
