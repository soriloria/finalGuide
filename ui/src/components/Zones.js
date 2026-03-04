import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Api from './Api';
import '../styles/Zones.css';
import Modal from "./Modal.js";
import { createPortal } from "react-dom";


/* ================= GOOGLE MAPS LOADER ================= */
const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;
let googleMapsPromise = null;

const loadGoogleMaps = () => {
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,marker`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve(window.google);
    script.onerror = reject;

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};


/* ====================================================== */

/* ================= INFO MODAL ================= */
const InfoModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="info-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="info-modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="info-modal-title">{title}</h2>
        <div className="info-modal-message">{message}</div>
        <div className="info-modal-button-wrapper">
          <button onClick={onClose} className="info-modal-confirm">OK</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* =============================================== */

const Zones = () => {
    const [sidebarExpanded, setSidebarExpanded] = useState(false);

    const toggleSidebar = () => {
      setSidebarExpanded(prev => !prev);

      setTimeout(() => {
        if (googleMap.current) {
          window.google.maps.event.trigger(googleMap.current, 'resize');
        }
      }, 300);
    };

    const getInitialZoom = () => {
      return window.innerWidth <= 480 ? 11 : 12;
    }


  const [reloadAfterInfo, setReloadAfterInfo] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [allZones, setAllZones] = useState([]);
  const [zones, setZones] = useState([]);
  const [activeZones, setActiveZones] = useState([]);
  const [hasPlan, setHasPlan] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(false);

  const [infoMessage, setInfoMessage] = useState("");
  const [infoTitle, setInfoTitle] = useState("Info");
  const mapInitialized = useRef(false);
  const isLoggedIn = () => {
      return !!localStorage.getItem("access");
    };


  const navigate = useNavigate();

  const markersRef = useRef([]);
  const mapRef = useRef(null);
  const googleMap = useRef(null);
  const currentInfoWindow = useRef(null);


useEffect(() => {
  if (!isLoggedIn()) {
    navigate("/login");
  }
}, [navigate]);





  /* ================== CHECK PLAN ================== */
  const checkPlan = useCallback(async () => {
    setCheckingPlan(true);
    try {
      const res = await Api.get('/plans/');
      setHasPlan(res.data.length > 0);
    } catch (error) {
      console.error('Error validating plan:', error);
      setHasPlan(false);
    } finally {
      setCheckingPlan(false);
    }
  }, []);

  /* MARKERS!!!!!!!!!!!! =====================================================  */

  const placeMarkers = useCallback(async (placesData) => {
  if (!googleMap.current || !window.google) return;

  // Очистка старих маркерів
  markersRef.current.forEach(marker => marker.map = null);
  markersRef.current = [];

  const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary('marker');

  const isMobile = window.innerWidth <= 480;

  placesData.forEach((place, index) => {
    const pin = new PinElement({
      glyphColor: 'white',
      background: '#162B45',
      borderColor: '#fff',
      scale: isMobile ? 0.7 : 0.9
    });

    const marker = new AdvancedMarkerElement({
      map: googleMap.current,
      position: { lat: place.latitude, lng: place.longitude },
      title: place.name,
      content: pin,
      gmpClickable: true,
    });

    marker.zoneName = place.zone;

    marker.setActive = (isActive) => {
      pin.background = isActive ? '#FF3D00' : '#162B45';
      pin.scale = isActive ? (isMobile ? 0.9 : 1.1) : (isMobile ? 0.7 : 0.9);

      const markerContent = marker.content;
      if (markerContent instanceof HTMLElement) {
        markerContent.style.transition = 'transform 0.15s ease';
        markerContent.style.transform = 'scale(1)';
        if (isActive) {
          setTimeout(() => {
            markerContent.style.transform = `scale(${isMobile ? 0.8 : 0.9})`;
          }, 700);
        }
      }
    };

    const closeBtnId = `custom-close-btn-${index}`;

    marker.addEventListener('gmp-click', () => {
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="max-width:180px; position:relative;">
            <button id="${closeBtnId}" style="
                position:absolute;
                top: -6px;
                right: 0px;
                border:none;
                background:none;
                font-size:24px;
                cursor:pointer;
                z-index: 10;
                padding: 0;
              ">×</button>
            <h3 style="margin-top:8px; margin-bottom:4px; border-radius:5px; font-size: 14px; font-weight: bold; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">${place.name}</h3>
            ${place.photo1 ? `<img src="${place.photo1}" style="width:100%; border-radius:5px;" />` : '<p>No photo</p>'}
          </div>
        `,
        position: { lat: place.latitude, lng: place.longitude },
        disableAutoPan: true,
      });

      if (currentInfoWindow.current) currentInfoWindow.current.close();
      infoWindow.open({ map: googleMap.current });
      currentInfoWindow.current = infoWindow;

      window.google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
        const closeBtn = document.getElementById(closeBtnId);
        if (closeBtn) closeBtn.addEventListener('click', () => infoWindow.close());
      });
    });

    markersRef.current.push(marker);
  });
}, []);


  /* ================== FETCH PLACES ================== */
  const fetchPlaces = useCallback(async (cityId) => {
    try {
      const response = await Api.get(`/places/?city=${cityId}`);
      placeMarkers(response.data);
    } catch (error) {
      console.error('Error loading places:', error);
    }
  }, [placeMarkers]);

/* ================== MAP HELPERS ================== */
const centerCity = useCallback((cityName) => {
  if (!googleMap.current || !window.google) return;

  const geocoder = new window.google.maps.Geocoder();

  geocoder.geocode({ address: cityName }, (results, status) => {
    if (status === "OK" && results[0]) {
      googleMap.current.setCenter(results[0].geometry.location);
      googleMap.current.setZoom(getInitialZoom());
    } else {
      console.error("Geocode failed:", status);
    }
  });
}, []);


  /* ================== INIT MAP + DATA ================== */
const fetchInitialData = useCallback(async () => {
  try {
    const [citiesRes, zonesRes] = await Promise.all([
      Api.get('/cities/'),
      Api.get('/zones/'),
    ]);

    setCities(citiesRes.data);
    setAllZones(zonesRes.data);

    const savedCityId = localStorage.getItem('selectedCity');
    const initialCity =
      citiesRes.data.find(c => c.id.toString() === savedCityId) ||
      citiesRes.data[0];

    if (initialCity) {
      setSelectedCity(initialCity.id.toString());
      localStorage.setItem('selectedCity', initialCity.id.toString());

      await centerCity(initialCity.name);
      filterZones(initialCity.id, zonesRes.data);
      await fetchPlaces(initialCity.id);
    }

    await checkPlan();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}, [checkPlan, fetchPlaces, centerCity]);




const initMap = useCallback(async () => {
  if (mapInitialized.current) return;
  if (!mapRef.current) return;
  if (document.visibilityState !== 'visible') return;

  try {
    // Завантажуємо Google Maps API
    await loadGoogleMaps();

    // Створюємо карту
    googleMap.current = new window.google.maps.Map(mapRef.current, {
      zoom: getInitialZoom(),
      center: { lat: 0, lng: 0 }, // тимчасово
      mapId: {process.env.REACT_APP_GOOGLE_MAP_ID}, // твій Map ID
    });

    mapInitialized.current = true;

    // Завантажуємо міста та зони
    const [citiesRes, zonesRes] = await Promise.all([
      Api.get('/cities/'),
      Api.get('/zones/'),
    ]);

    setCities(citiesRes.data);
    setAllZones(zonesRes.data);

    // Визначаємо початкове місто
    const savedCityId = localStorage.getItem('selectedCity');
    const initialCity =
      citiesRes.data.find(c => c.id.toString() === savedCityId) ||
      citiesRes.data[0];

    if (initialCity) {
      setSelectedCity(initialCity.id.toString());
      localStorage.setItem('selectedCity', initialCity.id.toString());

      // Центруємо карту на обраному місті
      centerCity(initialCity.name);

      // Фільтруємо зони та завантажуємо маркери
      filterZones(initialCity.id, zonesRes.data);
      await fetchPlaces(initialCity.id);
    }

    // Перевіряємо план
    await checkPlan();

  } catch (e) {
    console.error('Google Maps init error:', e);
  }
}, [centerCity, checkPlan, fetchPlaces]);


useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      initMap();
    }
  };

  if (document.visibilityState === 'visible') {
    initMap();
  }

  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}, [initMap]);


  const filterZones = (cityId, zonesData) => {
    const filtered = zonesData.filter(
      zone => zone.city === parseInt(cityId)
    );
    setZones(filtered);
  };


  /* ================== UI LOGIC ================== */
const toggleZone = (zoneName) => {
  const updatedZones = activeZones.includes(zoneName)
    ? activeZones.filter(z => z !== zoneName)
    : [...activeZones, zoneName];

  setActiveZones(updatedZones);

  markersRef.current.forEach(marker => {
    const isActive = updatedZones.includes(marker.zoneName);
    marker.setActive(isActive);
  });
};

  const handleCityChange = async (e) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
    localStorage.setItem('selectedCity', cityId);

    const city = cities.find(c => c.id.toString() === cityId);
    if (!city) return;

    await centerCity(city.name);
    filterZones(city.id, allZones);
    setActiveZones([]);
    await fetchPlaces(city.id);
  };

  /* ================== PLAN ACTIONS ================== */
    const createPlan = async () => {
      if (checkingPlan) return showInfoModal("Loading...");
      if (activeZones.length === 0)
        return showInfoModal("Please select at least one zone first");

      try {
        const res = await Api.get("/plans/");
        if (res.data && res.data.length > 0) {
          showInfoModal(
            "Plan already exists. The page will be refreshed",
            "Plan has already been created",
            true
          );
          return;
        }


        setIsModalOpen(true);
      } catch (err) {
        window.location.reload();
      }
    };

    const confirmCreatePlan = async () => {
      if (!planName.trim()) {
        showInfoModal("Enter the name of the plan");
        return;
      }

      try {

        const checkRes = await Api.get("/plans/");
        if (checkRes.data && checkRes.data.length > 0) {
          setIsModalOpen(false);
          showInfoModal(
            "Plan already exists. The page will be refreshed",
            "Plan has already been created",
            true
          );
          return;
        }

        const selectedZoneIds = zones
          .filter(z => activeZones.includes(z.name))
          .map(z => z.id);

        const res = await Api.post("/plans/", {
          name: planName,
          is_active: true,
          zones: selectedZoneIds,
        });

        setHasPlan(true);
        setIsModalOpen(false);
        setPlanName("");

        showInfoModal(`Plan "${res.data.name}" successfully created!`);
      } catch (error) {
        window.location.reload();
      }
    };


  const openDeletePlanModal = () => {
    if (!hasPlan) return;
    setDeleteModalOpen(true);
  };

    const confirmDeletePlan = async () => {
      try {
        const res = await Api.get("/plans/");


        if (!res.data || res.data.length === 0) {
          window.location.reload();
          return;
        }

        await Api.delete(`/plans/${res.data[0].id}/`);

        setHasPlan(false);
        setDeleteModalOpen(false);
        showInfoModal("plan has been successfully deleted");
      } catch (error) {
        window.location.reload();
      }
    };


    const showInfoModal = (message, title = "Info", reload = false) => {
      setInfoTitle(title);
      setInfoMessage(message);
      setReloadAfterInfo(reload);
      setInfoModalOpen(true);
    };


  /* ================== RENDER ================== */
  return (
    <div className="zones-container">
      <div id="map" className="map" ref={mapRef}></div>
        <button
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
          >
            {sidebarExpanded ? '❯' : '❮'}
      </button>
      <div className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>

          <div className="sidebar-content">
            <div className="city-select-container">
              <label htmlFor="city-select">Choose City:</label>
              <select
                id="city-select"
                value={selectedCity}
                onChange={handleCityChange}
              >
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="zones-list">
              <h4>Zones</h4>
              {zones.length ? (
                <div className="zones-buttons">
                  {zones.map(zone => (
                    <button
                      key={zone.id}
                      className={activeZones.includes(zone.name) ? 'active-zone' : ''}
                      onClick={() => toggleZone(zone.name)}
                    >
                      {zone.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p>No Zones for current city</p>
              )}
            </div>

            <div className="create-plan-container">
              <button
                className={`create-plan-btn ${activeZones.length === 0 || hasPlan || checkingPlan ? 'disabled' : ''}`}
                onClick={createPlan}
                disabled={activeZones.length === 0 || hasPlan || checkingPlan}
              >
                {checkingPlan ? 'Check...' : hasPlan ? 'Plan already exists' : 'Create plan from chosen'}
              </button>

              <button
                className={`delete-plan-btn ${hasPlan ? 'active-delete' : ''}`}
                onClick={openDeletePlanModal}
                disabled={!hasPlan}
              >
                Delete previous plan
              </button>
            </div>
          </div>



        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create plan"
          onConfirm={confirmCreatePlan}
          confirmText="Create"
          cancelText="Cancel"
          message={
            <input
              className='nameP'
              type="text"
              placeholder="Plan name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            />
          }
        />

        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete plan?"
          message={
            <div>
              Are you sure you want to delete existing plan?
            </div>
          }
          onConfirm={confirmDeletePlan}
          confirmText="Yes, delete"
          cancelText="Cancel"
        />


        {/* Info Modal */}
        <InfoModal
          isOpen={infoModalOpen}
          onClose={() => {
            setInfoModalOpen(false);
            if (reloadAfterInfo) {
              window.location.reload();
            }
          }}
          title={infoTitle}
          message={infoMessage}
        />


    <div className="navigation-buttons">
          <button
            className="nav-btn"
            onAuxClick={(e) => {
              if (e.button === 1) {
                window.open("/", "_blank");
              }
            }}
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Homepage
          </button>

          <button
            className="nav-btn"
            onAuxClick={(e) => {
              if (e.button === 1) {
                window.open("/my-plan", "_blank");
              }
            }}
            onClick={() => navigate("/my-plan")}
          >
            Plan page
          </button>
        </div>
      </div>
    </div>
  );
};

export default Zones;
