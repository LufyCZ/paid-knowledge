import { useEffect, useState } from "react";

type Location = {
    latitude: number;
    longitude: number;
}

export const useLocation = () => {
    const [location, setLocation] = useState<Location>({
        latitude: 0,
        longitude: 0
    });

    useEffect(() => {
        const fetchLocation = async () => {
            navigator.geolocation.getCurrentPosition((position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            });
        }
        fetchLocation();
    }, []);

    return location;
}