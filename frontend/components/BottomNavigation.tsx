"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { ClientOnly } from "./ClientOnly";
import { FaGlobeAmericas } from "react-icons/fa";
import { RiAccountCircleLine } from "react-icons/ri";

const navigation = [
  {
    name: "Home",
    href: "/",
    Icon: FaGlobeAmericas,
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
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6"
          style={{ height: "83px" }}
        >
          <div className="flex justify-center items-center space-x-16 max-w-md mx-auto h-full">
            <div className="flex items-center justify-center w-10 h-10">
              <FaGlobeAmericas className="w-7 h-7 text-black" />
            </div>
            <div className="flex items-center justify-center w-10 h-10">
              <RiAccountCircleLine className="w-7 h-7 text-gray-600" />
            </div>
          </div>
        </div>
      }
    >
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6"
        style={{ height: "83px" }}
      >
        <div className="flex justify-center items-center space-x-16 max-w-md mx-auto h-full">
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
                className="flex items-center justify-center w-10 h-10 transition-opacity hover:opacity-80"
              >
                <IconComponent
                  className={`w-7 h-7 ${
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
