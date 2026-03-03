import React, { useEffect, useState, useRef } from "react";
import Header from "./Header";
import "../styles/Homepage.css";
import { useNavigate } from "react-router-dom";
import api from "./Api";

export default function Homepage() {
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [cardsPerView, setCardsPerView] = useState(4);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const [showCarousel, setShowCarousel] = useState(true);
  const navigate = useNavigate();
  const carouselRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const fetchCitiesAndPlaces = async () => {
      try {
        const res = await api.get("/cities/");
        const citiesData = res.data.results || res.data || [];

        const promises = citiesData.map(async (city) => {
          const placesRes = await api.get(`/places/?city=${city.id}`);
          return {
            ...city,
            placesCount: placesRes.data.results?.length || placesRes.data.length || 0
          };
        });

        const citiesWithPlaces = await Promise.all(promises);
        const sortedCities = citiesWithPlaces.sort((a, b) => b.placesCount - a.placesCount);

        if (mounted) setCities(sortedCities);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoadingCities(false);
      }
    };

    fetchCitiesAndPlaces();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (cities.length === 0) return;

    const updateLayout = () => {
      const width = window.innerWidth;
      let perView;
      if (width >= 1280) perView = 4;
      else if (width >= 1024) perView = 3;
      else if (width >= 640) perView = 2;
      else perView = 1;
      setCardsPerView(perView);

      const cardWidth = 400 + 20;
      const totalWidth = cities.length * cardWidth;
      setShowCarousel(totalWidth > width);
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [cities]);

  const scroll = (direction) => {
    if (!carouselRef.current) return;

    const container = carouselRef.current;
    const card = container.querySelector(".city-card");
    if (!card) return;

    const style = window.getComputedStyle(card);
    const cardWidth = card.offsetWidth;
    const gap = parseInt(style.marginRight) || 20;

    container.scrollBy({
      left: direction === "right" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const hasReloaded = sessionStorage.getItem("homepageReloaded");
    if (!hasReloaded) {
      sessionStorage.setItem("homepageReloaded", "true");
      window.location.reload();
    }
  }, []);

  return (
    <div className="page-container">
      <Header />
      <main className="main">
        <h2>Choose city</h2>

          {isMobile && (
            <>
              <div className="mobile-arrow left-arrow"></div>
              <div className="mobile-arrow right-arrow"></div>
            </>
          )}

        {loadingCities ? (
          <p>Loading...</p>
        ) : (
          <div className="carousel-wrapper">
            {/* Стрілки ПК */}
            {!isMobile && showCarousel && (
              <button className="arrow left" onClick={() => scroll("left")}>➞</button>
            )}

            <div
              className={`cities-grid ${isMobile ? "mobile-swipe" : ""}`}
              ref={carouselRef}
            >
              {cities.map((city) => (
                <div
                  key={city.id}
                  className="city-card"
                  style={{ flex: `0 0 calc(${100 / cardsPerView}% - 20px)` }}
                >
                  <div className="city-photo">
                    {city.photo ? (
                      <img src={city.photo} alt={city.name} />
                    ) : (
                      <div className="placeholder">City photo</div>
                    )}
                  </div>
                  <div className="city-content">
                    <div className="city-info">
                      <h3>{city.name}</h3>
                      <p>{city.description}</p>
                    </div>
                    <button
                      onClick={() =>
                        navigate(
                          `/${encodeURIComponent(city.name.toLowerCase())}`,
                          { state: { cityId: city.id } }
                        )
                      }
                    >
                      Discover places →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Стрілки ПК */}
            {!isMobile && showCarousel && (
              <button className="arrow right" onClick={() => scroll("right")}>➞</button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
