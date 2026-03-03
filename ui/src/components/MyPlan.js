import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Api from "./Api";
import "../styles/MyPlan.css";
import Header from './Header.js';
import Modal from "./Modal.js";
import InfoModal from "./InfoModal";

const MyPlan = () => {
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [currentLatLng, setCurrentLatLng] = useState({ lat: null, lng: null });
    const [destLatLng, setDestLatLng] = useState({ lat: null, lng: null });

  const [plan, setPlan] = useState(null);
  const [zonesData, setZonesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedZones, setExpandedZones] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const navigate = useNavigate();


  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalConfirmAction, setModalConfirmAction] = useState(() => () => {});
  const [modalConfirmText, setModalConfirmText] = useState("OK");

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchPlanData = async () => {
      try {
        const planRes = await Api.get("/plans/");
        if (planRes.data.length === 0) {
          setPlan(null);
          setLoading(false);
          return;
        }
        const userPlan = planRes.data[0];
        setPlan(userPlan);
        setIsCompleted(!userPlan.is_active);

        const [zonesRes, placesRes, citiesRes, progressRes] = await Promise.all([
          Api.get("/zones/"),
          Api.get("/places/"),
          Api.get("/cities/"),
          Api.get("/progress/"),
        ]);

        const cityDict = {};
        citiesRes.data.forEach(city => {
          cityDict[city.id] = city.name;
        });

        const planZones = zonesRes.data.filter(zone =>
          userPlan.zones.includes(zone.id)
        );

        const planPlaces = placesRes.data.filter(place =>
          userPlan.zones.some(zoneId => {
            const zone = zonesRes.data.find(z => z.id === zoneId);
            return (
              zone &&
              place.zone === zone.name &&
              place.city === zone.city
            );
          })
        );


        const progressDict = {};
        progressRes.data.forEach(p => {
          if (!progressDict[p.plan]) progressDict[p.plan] = {};
          progressDict[p.plan][p.place] = { id: p.id, is_visited: p.is_visited };
        });

        const structuredZones = planZones
          .map(zone => {
            const zonePlaces = planPlaces
              .filter(place => place.zone === zone.name)
              .map(place => ({
                ...place,
                visited: progressDict[userPlan.id]?.[place.id]?.is_visited || false,
                progressId: progressDict[userPlan.id]?.[place.id]?.id || null,
              }));

            const visitedCount = zonePlaces.filter(p => p.visited).length;

            return {
              ...zone,
              places: zonePlaces,
              visitedCount,
              cityName: cityDict[zone.city],
            };
          })
          .sort((a, b) => b.places.length - a.places.length);

        setZonesData(structuredZones);

      } catch (error) {
        console.error("Error loading plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanData();
  }, [navigate]);

  const toggleZone = (zoneId) => {
    setExpandedZones(prev => ({ ...prev, [zoneId]: !prev[zoneId] }));
  };

  const saveProgress = async (progressId, planId, placeId, isVisited) => {
    try {
      if (progressId) {
        const res = await Api.patch(`/progress/${progressId}/`, { is_visited: isVisited });
        return res.data.id;
      } else {
        const res = await Api.post(`/progress/`, { plan: planId, place: placeId, is_visited: isVisited });
        return res.data.id;
      }
    } catch (err) {
      console.error("Error saving progress:", err);
    }
  };

  const togglePlaceVisited = async (zoneId, placeId) => {
    if (isCompleted) return;
    setZonesData(prevZones =>
      prevZones.map(zone => {
        if (zone.id === zoneId) {
          const updatedPlaces = zone.places.map(place => {
            if (place.id === placeId) {
              const newVisited = !place.visited;
              saveProgress(place.progressId, plan.id, place.id, newVisited)
                .then(id => (place.progressId = id))
                .catch(err => console.error(err));
              return { ...place, visited: newVisited };
            }
            return place;
          });
          const visitedCount = updatedPlaces.filter(p => p.visited).length;
          return { ...zone, places: updatedPlaces, visitedCount };
        }
        return zone;
      })
    );
  };

    const handleDeletePlan = async () => {
      if (!plan) return;

      try {
        const checkRes = await Api.get("/plans/");
        if (!checkRes.data || checkRes.data.length === 0) {
          window.location.reload();
          return;
        }

        const existingPlan = checkRes.data[0];

        await Api.delete(`/plans/${existingPlan.id}/`);

        setPlan(null);
        setZonesData([]);
        setModalOpen(false);
      } catch (err) {
        window.location.reload();
      }
    };


    const handleCreateNewPlan = async () => {
      if (plan) {
        try {
          await Api.delete(`/plans/${plan.id}/`);
        } catch (err) {

        }
      }
      setModalOpen(false);
      navigate("/zones");
    };


    const handleToggleCompleted = async () => {
      if (!plan) return;

      try {
        const checkRes = await Api.get("/plans/");
        if (!checkRes.data || checkRes.data.length === 0) {
          window.location.reload();
          return;
        }

        const existingPlan = checkRes.data[0];
        const newActiveStatus = !existingPlan.is_active;

        const res = await Api.patch(`/plans/${existingPlan.id}/`, {
          is_active: newActiveStatus,
        });

        setPlan(prev => ({ ...prev, is_active: res.data.is_active }));
        setIsCompleted(!res.data.is_active);
      } catch (err) {
        console.error("Failed to update plan status:", err);
        window.location.reload();
      }
    };

 // ===================== MAP =============================================================

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




  const openDeleteModal = () => {
    setModalTitle("Delete plan?");
    setModalMessage("Are you sure you want to delete the current plan?");
    setModalConfirmText("Yes, delete");
    setModalConfirmAction(() => handleDeletePlan);
    setModalOpen(true);
  };

  const openCreateNewModal = () => {
    setModalTitle("Create new plan?");
    setModalMessage("This will delete the current plan. Continue?");
    setModalConfirmText("Yes, continue");
    setModalConfirmAction(() => handleCreateNewPlan);
    setModalOpen(true);
  };

  if (loading) return <p>Loading...</p>;

  if (!plan)
    return (
      <>
        <Header />
        <div className="my-plan-page">
          <div className="my-plan-container">
            <div className="plan-empty">
              <p className="plan-title">No plan yet</p>
              <button onClick={() => navigate("/zones")}>Create a plan →</button>
            </div>
          </div>
        </div>
      </>
    );

  const cityName = zonesData.length > 0 ? zonesData[0]?.cityName : "";

  return (
    <>
      <Header />
      <div className="my-plan-page">
        <div className="my-plan-container">
          <h2 className="plan-title2">
            <span className="city-name">Plan for {cityName}</span>
            <span className="plan-name"> {plan.name}</span>
          </h2>

          <div className="zones-table">
            {zonesData.map(zone => {
              const progressPercent =
                zone.places.length > 0
                  ? Math.round((zone.visitedCount / zone.places.length) * 100)
                  : 0;
              const allVisited = progressPercent === 100;

              return (
                <div key={zone.id} className="zone-card">
                  <div
                    className={`zone-header ${expandedZones[zone.id] ? "expanded" : ""}`}
                    onClick={() => toggleZone(zone.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <h3>{zone.name} ⌄</h3>
                    <span>{allVisited && "✅"} {progressPercent}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>

                  <ul className={`places-list ${expandedZones[zone.id] ? "expanded" : ""}`}>
                    {zone.places.map(place => (
                      <li key={place.id} className={place.visited ? "visited" : "not-visited"}>
                        <span className="place-name">{place.name}</span>


                        <div className="place-buttons">
                          {window.innerWidth > 480 ? (
                            <>
                              <button onClick={() => handleShowOnMap(place.latitude, place.longitude)}>
                                🟢 Go→
                              </button>
                              <button
                                className="place-visit-btn"
                                onClick={() => togglePlaceVisited(zone.id, place.id)}
                                disabled={isCompleted}
                              >
                                {place.visited ? "🚶‍♂️ visited" : "🚫 not-visited"}
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleShowOnMap(place.latitude, place.longitude)}>
                                🗺Map
                              </button>
                              <button
                              className="place-visit-btn"
                              onClick={() => togglePlaceVisited(zone.id, place.id)}
                              disabled={isCompleted}
                              style={
                                window.innerWidth <= 480
                                  ? { background: "none", color: "inherit", minWidth: "auto", padding: "4px 6px" }
                                  : {}
                              }
                            >
                              {place.visited ? "✔️" : "❌"}
                            </button>
                            </>
                          )}
                        </div>



                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {isCompleted && (
            <p className="completed-msg">
              ✅ Plan marked as completed, editing unavailable
            </p>
          )}

          <div className="plan-buttons">
            <button onClick={openDeleteModal}>🗑️ Delete plan</button>
            <button onClick={openCreateNewModal}>➕ Create new</button>
            <button
              onClick={handleToggleCompleted}
              className={isCompleted ? "completed" : ""}
            >
              {isCompleted ? "🔓 Unmark completed" : "✅ Mark completed"}
            </button>
          </div>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title={
                <span
                  style={{
                    fontSize: '22px',
                    marginBottom: '0px',
                    fontWeight: 'bold'
                  }}
                >
                  {modalTitle}
                </span>
              }
            message={modalMessage}
            onConfirm={modalConfirmAction}
            confirmText={modalConfirmText}
            cancelText="Cancel"
          />

        <InfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          onApp={() => openInApp(currentLatLng.lat, currentLatLng.lng, destLatLng.lat, destLatLng.lng)}
          onBrowser={() => openInBrowser(currentLatLng.lat, currentLatLng.lng, destLatLng.lat, destLatLng.lng)}
        />



        </div>
      </div>
    </>
  );
};

export default MyPlan;
