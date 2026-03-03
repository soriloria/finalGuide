import React, { useEffect, useState, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import Header from "./Header";
import "../styles/Places.css";
import api from "./Api";
import InfoModal from "./InfoModal";

function NextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: "block", right: 10, zIndex: 1 }}
      onClick={onClick}
    />
  );
}

function PrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: "block", left: 10, zIndex: 1 }}
      onClick={onClick}
    />
  );
}

function Places() {
  const location = useLocation();
  const navigate = useNavigate();
  const cityId = location.state?.cityId;
  const [places, setPlaces] = useState([]);
  const [city, setCity] = useState("");

useEffect(() => {
    if (!cityId) {
      navigate("/", { replace: true });
      return;
    }

    api.get(`/cities/${cityId}/`)
      .then((res) => setCity(res.data.name))
      .catch(() => {
        navigate("/", { replace: true });
      });
    }, [cityId, navigate]);

  const [modalPhotos, setModalPhotos] = useState([]);
  const [modalStartIndex, setModalStartIndex] = useState(0);

  const [favorites, setFavorites] = useState([]);
  const [isAuth, setIsAuth] = useState(false);

  const photoRefs = useRef([]);
  const imgDragStart = useRef({ x: 0, y: 0 });
  const sliderRef = useRef(null);
  const scrollRefs = useRef({});
  const [showScrollBtns, setShowScrollBtns] = useState({}); // { zoneName: true/false }

  useEffect(() => {
    if (!cityId) return;

    api.get(`/places/?city=${cityId}`)
      .then((res) => setPlaces(res.data.results || res.data))
      .catch((err) => console.error(err));

    api.get(`/cities/${cityId}/`)
      .then((res) => setCity(res.data.name))
      .catch((err) => console.error(err));
  }, [cityId]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      setIsAuth(true);
      api.get("/selected-places/")
        .then((res) => setFavorites(res.data))
        .catch((err) => console.error(err));
    }
  }, []);

  const handleToggleFavorite = (placeId) => {
    const existing = favorites.find((f) => f.place === placeId);

    if (existing) {
      api.delete(`/selected-places/${existing.id}/`)
        .then(() => {
          setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
        })
        .catch((err) => console.error(err));
    } else {
      api.post("/selected-places/", { place: placeId })
        .then((res) => {
          setFavorites((prev) => [...prev, res.data]);
        })
        .catch((err) => console.error(err));
    }
  };


  const zonesMap = useMemo(() => {
    const map = {};
    places.forEach((place) => {
      if (!map[place.zone]) map[place.zone] = [];
      map[place.zone].push(place);
    });
    return map;
  }, [places]);

    const scroll = (zone, direction) => {
      const container = scrollRefs.current[zone];
      if (container) {
        let scrollAmount = container.clientWidth / 2;

        if (window.innerWidth <= 480) {
          scrollAmount *= 1.5;
        }

        container.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth"
        });
      }
    };



  useEffect(() => {
    Object.keys(zonesMap).forEach((zone) => {
      const container = scrollRefs.current[zone];
      if (container) {
        setShowScrollBtns((prev) => ({
          ...prev,
          [zone]: container.scrollWidth > container.clientWidth
        }));
      }
    });
  }, [zonesMap]);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    accessibility: false,
  };

  const modalSliderSettings = {
    dots: true,
    infinite: false,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    initialSlide: modalStartIndex,
    accessibility: true,
afterChange: (current) => {
  const currentSlide = sliderRef.current.innerSlider.list.querySelector(
    ".slick-slide.slick-current"
  );
  currentSlide?.focus();
},

  };

    useEffect(() => {
      if (modalPhotos.length > 0) {
        setTimeout(() => {
          photoRefs.current[modalStartIndex]?.focus();
        }, 0);
      }
    }, [modalPhotos, modalStartIndex]);



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

  return (
    <div className="page-container">
      <Header />
      <main className="places-main">
        <h2 className='city-title'>{city}</h2>

        {Object.keys(zonesMap).length === 0 ? (
          <p>Loading..</p>
        ) : (
          Object.entries(zonesMap)
          .sort((a, b) => b[1].length - a[1].length)
          .map(([zone, placesInZone]) => (
            <div key={zone} className="zone-section">
              <h3>{zone}</h3>
              <div className="scroll-container">
                {showScrollBtns[zone] && window.innerWidth > 480 && (
                  <button className="scroll-btn left" onClick={() => scroll(zone, "left")}>➞</button>
                )}

                <div className="places-row" ref={(el) => (scrollRefs.current[zone] = el)}>
                  {placesInZone.map((place) => {
                    const photos = [place.photo1, place.photo2, place.photo3].filter(Boolean);

                    return (
                            <div key={place.id} className="place-card">
                              {photos.length > 0 && (
                                <Slider {...sliderSettings} className="place-gallery">
                                  {photos.map((photo, idx) => (
                                    <div key={idx}>
                                      <img
                                        src={photo}
                                        alt={place.name}
                                        style={{ cursor: "pointer" }}
                                        onMouseDown={(e) => (imgDragStart.current = { x: e.clientX, y: e.clientY })}
                                        onMouseUp={(e) => {
                                          const dx = Math.abs(e.clientX - imgDragStart.current.x);
                                          const dy = Math.abs(e.clientY - imgDragStart.current.y);
                                          if (dx < 5 && dy < 5) {
                                            setModalPhotos(photos);
                                            setModalStartIndex(idx);
                                            photoRefs.current = [];
                                          }
                                        }}
                                        onTouchStart={(e) =>
                                          (imgDragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })
                                        }
                                        onTouchEnd={(e) => {
                                          const dx = Math.abs(e.changedTouches[0].clientX - imgDragStart.current.x);
                                          const dy = Math.abs(e.changedTouches[0].clientY - imgDragStart.current.y);
                                          if (dx < 5 && dy < 5) {
                                            setModalPhotos(photos);
                                            setModalStartIndex(idx);
                                            photoRefs.current = [];
                                          }
                                        }}
                                      />
                                    </div>
                                  ))}
                                </Slider>
                              )}
                              <h4 className="place-title">{place.name}</h4>
                              <p>{place.description}</p>

                        <div className="place-card-buttons">
                          <button
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              cursor: isAuth ? "pointer" : "not-allowed",
                              opacity: 1,
                              position: "relative",
                            }}
                            onClick={() => {
                              if (isAuth) handleToggleFavorite(place.id);
                            }}
                            onMouseEnter={(e) => {
                            if (!isAuth) {
                              const tooltip = document.createElement("span");
                              tooltip.innerText = "Sign In to add to favorites";
                              tooltip.style.position = "fixed";
                              tooltip.style.top = e.clientY + 20 + "px";
                              tooltip.style.left = e.clientX + "px";
                              tooltip.style.transform = "translateX(-20%)";
                              tooltip.style.background = "#fff";
                              tooltip.style.color = "#000";
                              tooltip.style.padding = "4px 8px";
                              tooltip.style.borderRadius = "4px";
                              tooltip.style.fontSize = "12px";
                              tooltip.style.fontWeight = "bold";
                              tooltip.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
                              tooltip.style.pointerEvents = "none";
                              tooltip.style.zIndex = 1000;
                              tooltip.className = "temp-tooltip";
                              document.body.appendChild(tooltip);
                            }
                            }}
                            onMouseMove={(e) => {
                              const tooltip = document.querySelector(".temp-tooltip");
                              if (tooltip) {
                                tooltip.style.top = e.clientY + 20 + "px";
                                tooltip.style.left = e.clientX + "px";
                              }
                            }}
                            onMouseLeave={() => {
                              const tooltip = document.querySelector(".temp-tooltip");
                              if (tooltip) tooltip.remove();
                            }}
                          >
                            {favorites.some(f => f.place === place.id) ? (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFD700">
                                <path d="M12 .587l3.668 7.568L24 9.423l-6 5.85 1.417 8.254L12 18.896l-7.417 4.63L6 15.273 0 9.423l8.332-1.268z"/>
                              </svg>
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                                <path d="M12 .587l3.668 7.568L24 9.423l-6 5.85 1.417 8.254L12 18.896l-7.417 4.63L6 15.273 0 9.423l8.332-1.268z"/>
                              </svg>
                            )}
                          </button>

                          <button
                            className="show-on-map-btn"
                            onClick={() => handleShowOnMap(place.latitude, place.longitude)}
                          >
                            On Map 🗺
                          </button>
                        </div>

                        </div>

                    );
                  })}
                </div>

                {showScrollBtns[zone] && window.innerWidth > 480 && (
                  <button className="scroll-btn right" onClick={() => scroll(zone, "right")}>➞</button>
                )}
              </div>
            </div>
          ))
        )}
      </main>

        {modalPhotos.length > 0 && (
          <div className="photo-modal" onClick={() => setModalPhotos([])}>
            <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
              <Slider ref={sliderRef} {...modalSliderSettings}>
                {modalPhotos.map((photo, idx) => (
                  <div key={idx} className="photo-slide-wrapper">

                    <button
                      className="modal-close-btn"
                      onClick={() => setModalPhotos([])}
                      aria-label="Close gallery"
                    >
                      ✖
                    </button>

                    <img
                      src={photo}
                      alt="preview"
                      className="photo-modal-img"
                      tabIndex={0}
                      ref={(el) => (photoRefs.current[idx] = el)}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const width = rect.width;
                        if (clickX > width * 0.8) sliderRef.current.slickNext();
                        else if (clickX < width * 0.2) sliderRef.current.slickPrev();
                      }}
                    />
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        )}

        <InfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          onApp={() => openInApp(currentLatLng.lat, currentLatLng.lng, destLatLng.lat, destLatLng.lng)}
          onBrowser={() => openInBrowser(currentLatLng.lat, currentLatLng.lng, destLatLng.lat, destLatLng.lng)}
        />

    </div>
  );
}

export default Places;
