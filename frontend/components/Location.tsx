"use client";

import { useLocation } from "../hooks/useLocation";

export default function Location() {
    const location = useLocation();

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-md">
                <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
                    <p>
                        <strong>Location:</strong> {location.latitude},{" "}
                        {location.longitude}
                    </p>
                </div>
            </div>
        </>
    );
}   
