import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Header.css";

/* TOOLTIP BUTTON */
function TooltipButton({ children, tooltip }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const handleMouseMove = (e) => setCoords({ x: e.clientX, y: e.clientY });

  return (
    <span
      className="btn-disabled"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onMouseMove={handleMouseMove}
    >
      {children}
      {visible && (
        <span
          className="tooltip-text"
          style={{
            top: coords.y + 20,
            left: coords.x,
            transform: "translateX(-50%)",
          }}
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}

function Header() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("access")
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("access"));
    };
    window.addEventListener("storage", handleStorageChange);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
    setMenuOpen(false);
    navigate("/");
  };

  const renderDropdownLinks = () => {
    if (isLoggedIn) {
      return (
        <>
          <Link to="/my-plan" className="btn-my-plan" onClick={() => setMenuOpen(false)}>📝 My Plan</Link>
          <Link to="/zones" className="btn-my-plan" onClick={() => setMenuOpen(false)}>🔍 Zones</Link>
          <Link to="/favorites" className="btn-favorites" onClick={() => setMenuOpen(false)}>❤️ Favorites</Link>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </>
      );
    } else {
      return (
        <>
          <Link to="/my-plan" style={{
                                backgroundColor: "#9ca3af",
                                color: "white",
                                pointerEvents: "none",
                                cursor: "not-allowed"
                              }}>📝 My Plan</Link>
          <Link to="/zones" style={{
                                backgroundColor: "#9ca3af",
                                color: "white",
                                pointerEvents: "none",
                                cursor: "not-allowed"
                              }}>🔍 Zones</Link>
          <Link to="/favorites"  style={{
                                backgroundColor: "#9ca3af",
                                color: "white",
                                pointerEvents: "none",
                                cursor: "not-allowed"
                              }}>❤️ Favorites</Link>
          <Link to="/login" className="btn-login" onClick={() => setMenuOpen(false)}>Sign In</Link>
          <Link to="/register" className="btn-register" onClick={() => setMenuOpen(false)}>Sign Up</Link>
        </>
      );
    }
  };

  return (
    <header className="header">
      <div className="header-row">
        {/* LEFT */}
        <div className="header-left">
          <Link to="/" className="btn-home">🏠 Home</Link>

          {windowWidth > 1050 && !menuOpen && (
            <>
              {isLoggedIn ? (
                <>
                  <Link to="/my-plan" className="btn-my-plan">📝 My Plan</Link>
                  <Link to="/zones" className="btn-my-plan">🔍 Zones</Link>
                  <Link to="/favorites" className="btn-favorites">❤️ Favorites</Link>
                </>
              ) : (
                <>
                  <TooltipButton tooltip="Sign In to access your plan">📝 My Plan</TooltipButton>
                  <TooltipButton tooltip="Sign In to view zones">🔍 Zones</TooltipButton>
                  <TooltipButton tooltip="Sign In to see favorites">❤️ Favorites</TooltipButton>
                </>
              )}
            </>
          )}
        </div>

        {/* CENTER */}
        <div className="header-center">🌍 City Tourist Guide</div>

        {/* RIGHT */}
        <div className="header-right">
          {windowWidth > 1050 && !menuOpen && (
            <>
              {!isLoggedIn ? (
                <>
                  <Link to="/login" className="btn-login">Sign In</Link>
                  <Link to="/register" className="btn-register">Sign Up</Link>
                </>
              ) : (
                <button className="btn-logout" onClick={handleLogout}>Logout</button>
              )}
            </>
          )}
          {windowWidth <= 1050 && (
            <button className="burger-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          )}
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {menuOpen && (
        <div className="dropdown-menu">
          <Link to="/" className="btn-home" onClick={() => setMenuOpen(false)}>🏠 Home</Link>
          {renderDropdownLinks()}
        </div>
      )}
    </header>
  );
}

export default Header;
