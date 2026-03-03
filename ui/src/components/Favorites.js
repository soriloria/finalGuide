import React, { useEffect, useState, useRef, useMemo } from "react";
import Header from "./Header";
import { useNavigate } from 'react-router-dom';
import api from "./Api";
import "../styles/Favorites.css";
import InfoModal from "./InfoModal";

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRefs = useRef({});
  const [showScrollBtns, setShowScrollBtns] = useState({});
    const isLoggedIn = () => {
      return !!localStorage.getItem("access");
    };

  const navigate = useNavigate();

useEffect(() => {
  if (!isLoggedIn()) {
    navigate("/login");
  }
}, [navigate]);


  useEffect(() => {
    let mounted = true;

    api.get("/selected-places/")
      .then(async (res) => {
        if (!mounted) return;
        const items = res.data;

        const promises = items.map((fav) => {
          let placePromise;
          if (fav.place && typeof fav.place === "object") {
            placePromise = Promise.resolve(fav.place);
          } else {
            placePromise = api.get(`/places/${fav.place}/`).then(r => r.data);
          }

          return placePromise
            .then(place => {
              if (place.city && typeof place.city === "number") {
                return api.get(`/cities/${place.city}/`).then(cityRes => {
                  place.city = { name: cityRes.data.name };
                  return { favId: fav.id, place };
                });
              }
              return { favId: fav.id, place };
            })
            .catch(err => {
              console.error("Error loading place or city", err);
              return null;
            });
        });

        const results = await Promise.all(promises);
        const good = results.filter((r) => r && r.place);
        if (mounted) setFavorites(good);
      })
      .catch(err => console.error("GET /selected-places/ error:", err))
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  const handleRemove = (favId) => {
    api.delete(`/selected-places/${favId}/`)
      .then(() => {
        setFavorites(prev => prev.filter(f => f.favId !== favId));
      })
      .catch(err => console.error("DELETE selected error:", err));
  };

// ========================== MAP =======================================================

const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
const [currentLatLng, setCurrentLatLng] = useState({ lat: null, lng: null });
const [destLatLng, setDestLatLng] = useState({ lat: null, lng: null });

const openInApp = (userLat, userLng, destLat, destLng) => {
  const isAndroid = /Android/i.test(navigator.userAgent);

  let url = "";

  if (isAndroid) {
    // Use intent for Android
    url = userLat && userLng
      ? `intent://maps.google.com/maps?saddr=${userLat},${userLng}&daddr=${destLat},${destLng}&directionsmode=transit#Intent;scheme=https;package=com.google.android.apps.maps;end`
      : `intent://maps.google.com/maps?daddr=${destLat},${destLng}&directionsmode=transit#Intent;scheme=https;package=com.google.android.apps.maps;end`;
  } else {
    // iOS
    url = userLat && userLng
      ? `comgooglemaps://?saddr=${userLat},${userLng}&daddr=${destLat},${destLng}&directionsmode=transit`
      : `comgooglemaps://?daddr=${destLat},${destLng}&directionsmode=transit`;
  }

  window.location.href = url;
  setIsInfoModalOpen(false);
};

const openInBrowser = (userLat, userLng, destLat, destLng) => {
  const url = userLat && userLng
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=transit`
    : `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
  window.open(url, "_blank");
  setIsInfoModalOpen(false);
};

const handleShowOnMap = (lat, lng) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  setDestLatLng({ lat, lng });

  const showModal = (userLat, userLng) => {
    setCurrentLatLng({ lat: userLat, lng: userLng });

    // If no user location, only show destination on map
    if (userLat === null || userLng === null) {
      setIsInfoModalOpen(true);
      return; // exit early, do not show route buttons
    }

    setIsInfoModalOpen(true); // modal can now show options for route
  };

  if (isMobile) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => showModal(pos.coords.latitude, pos.coords.longitude),
        () => showModal(null, null), // no geolocation -> only show destination
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      showModal(null, null); // fallback: only destination
    }
  } else {
    // On desktop, we can open directly in browser
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => openInBrowser(pos.coords.latitude, pos.coords.longitude, lat, lng),
        () => openInBrowser(null, null, lat, lng), // fallback: only destination
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      openInBrowser(null, null, lat, lng);
    }
  }
};



    const scroll = (city, direction) => {
      const container = scrollRefs.current[city];

      if (container) {
        let scrollAmount = container.clientWidth / 2;

        if (window.innerWidth <= 480) {
          scrollAmount *= 1.5;
        }

        container.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    };




    const groupedByCity = useMemo(() => {
      const map = {};
      favorites.forEach(({ favId, place }) => {
        const cityName =
          place?.city?.name ||
          (typeof place.city === "string" ? place.city : "Unknown city");

        if (!map[cityName]) map[cityName] = [];
        map[cityName].push({ favId, place });
      });
      return map;
    }, [favorites]);


    useEffect(() => {
      Object.keys(groupedByCity).forEach((city) => {
        const container = scrollRefs.current[city];
        if (container) {
          setShowScrollBtns((prev) => ({
            ...prev,
            [city]: container.scrollWidth > container.clientWidth
          }));
        }
      });
    }, [groupedByCity]);

  if (loading) return <p>Loading...</p>;

  return (
<div className="page-container">
  <Header />
  <main className="places-main">
    {favorites.length === 0 ? (
      <h2 className="favs-title2">No favorites yet</h2>
    ) : (
      <>
        <h2 className="favs-title">Favorites</h2>
        {Object.entries(groupedByCity)
          .sort((a, b) => b[1].length - a[1].length) // 🔥 сортування міст
          .map(([city, places]) => {
            const sortedPlaces = places.slice().sort((a, b) => b.favId - a.favId);

            return (
              <div key={city} className="zone-section">
              <h3>{city}</h3>
              <div className="scroll-container">
                {showScrollBtns[city] && window.innerWidth > 480 && (
                  <button className="scroll-btn left" onClick={() => scroll(city, "left")}>➞</button>
                )}

                <div
                  className="places-row"
                  ref={(el) => (scrollRefs.current[city] = el)}
                >
                  {sortedPlaces.map(({ favId, place }) => (
                    <div key={favId} className="place-card">
                      {place.photo1 ? (
                        <img src={place.photo1} alt={place.name} className="place-photo" />
                      ) : (
                        <div className="place-photo place-photo--empty">No photo</div>
                      )}
                      <h4>{place.name}</h4>
                      <div className="btns">
                        <button className="favorite-btn active" onClick={() => handleRemove(favId)}>
                          ❌
                        </button>
                        <button className="show-on-map-btn" onClick={() => handleShowOnMap(place.latitude, place.longitude)}>
                          Route 📍
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {showScrollBtns[city] && window.innerWidth > 480 && (
                  <button className="scroll-btn right" onClick={() => scroll(city, "right")}>➞</button>
                )}
              </div>
            </div>
          );
        })}
      </>
    )}

    <InfoModal
      isOpen={isInfoModalOpen}
      onClose={() => setIsInfoModalOpen(false)}
      onApp={() =>
        openInApp(
          currentLatLng.lat,
          currentLatLng.lng,
          destLatLng.lat,
          destLatLng.lng
        )
      }
      onBrowser={() =>
        openInBrowser(
          currentLatLng.lat,
          currentLatLng.lng,
          destLatLng.lat,
          destLatLng.lng
        )
      }
    />

  </main>
</div>

  );
}

export default Favorites;
